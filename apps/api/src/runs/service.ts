import { randomUUID } from "node:crypto";
import {
  type AgentRunner,
  ANALYSIS_INSTRUCTIONS,
  DEFAULT_ANALYSIS_TASK,
  TOOL_CALL_BUDGET,
} from "@loom/agent-runtime";
import {
  createAnalysisTools,
  createRunToolState,
  SESSION_01_TOOL_NAMES,
  type SourceRegistry,
} from "@loom/agent-tools";
import type { AgentProfile, RunEventPayload, RunTotals } from "@loom/contracts";
import {
  analysisResultStore,
  createRun,
  finishRun,
  getAnalysisResult,
  getRun,
  type LoomDatabase,
  listRuns,
  markInterruptedRuns,
} from "@loom/persistence";
import { RunHub } from "./hub.ts";

export class RunError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

type ActiveRun = { id: string; stop?: () => Promise<void>; done?: Promise<void> };

export class RunService {
  readonly hub = new RunHub();
  #active: ActiveRun | undefined;
  #closing = false;
  readonly db: LoomDatabase;
  readonly registry: SourceRegistry;
  readonly runner: AgentRunner;
  readonly log: (error: unknown) => void;
  constructor(
    db: LoomDatabase,
    registry: SourceRegistry,
    runner: AgentRunner,
    log: (error: unknown) => void,
  ) {
    this.db = db;
    this.registry = registry;
    this.runner = runner;
    this.log = log;
  }

  async initialize() {
    await markInterruptedRuns(this.db);
  }
  profile(): AgentProfile {
    return {
      toolNames: [...SESSION_01_TOOL_NAMES],
      toolCallBudget: TOOL_CALL_BUDGET,
      clientProfile: this.runner.profile,
      runtime: this.runner.runtime,
      model: this.runner.model,
      defaultTask: DEFAULT_ANALYSIS_TASK,
    };
  }
  list() {
    return listRuns(this.db);
  }
  async detail(id: string) {
    const run = await getRun(this.db, id);
    if (!run) throw new RunError(404, "Run not found");
    return { run, result: await getAnalysisResult(this.db, id) };
  }

  async start(task = DEFAULT_ANALYSIS_TASK): Promise<string> {
    if (this.#closing) throw new RunError(503, "The API is shutting down");
    if (this.#active) throw new RunError(409, "A run is already active");
    // Reserve before the first await: two concurrent starts must not both create a run.
    const active: ActiveRun = { id: randomUUID() };
    this.#active = active;
    try {
      await createRun(this.db, {
        id: active.id,
        task,
        clientProfile: this.runner.profile,
        model: this.runner.model,
      });
      this.hub.create(active.id);
      const state = createRunToolState();
      const totals: RunTotals = {
        modelCalls: 0,
        inputTokens: 0,
        outputTokens: 0,
        toolCalls: 0,
        deniedToolCalls: 0,
      };
      const onEvent = (event: RunEventPayload) => {
        if (event.type === "usage") {
          totals.modelCalls++;
          totals.inputTokens += event.inputTokens;
          totals.outputTokens += event.outputTokens;
        }
        if (event.type === "tool.requested") totals.toolCalls++;
        if (event.type === "tool.denied") totals.deniedToolCalls++;
        this.hub.emit(active.id, event);
      };
      onEvent({ type: "run.started", task, clientProfile: this.runner.profile, model: this.runner.model });
      const tools = createAnalysisTools({
        runId: active.id,
        registry: this.registry,
        results: analysisResultStore(this.db),
        state,
        log: this.log,
      });
      // Schedule after returning the accepted request, and turn synchronous runner failures into outcomes.
      active.done = Promise.resolve()
        .then(async () => {
          let status: "completed" | "incomplete" | "failed" | "stopped" = "failed";
          let error: string | null = null;
          let sessionId: string | null = null;
          try {
            const handle = this.runner.start({
              runId: active.id,
              task,
              tools,
              instructions: ANALYSIS_INSTRUCTIONS,
              hasReadSource: () => state.readSourceIds.size > 0,
              onEvent,
            });
            active.stop = handle.stop;
            if (this.#closing) await handle.stop();
            const outcome = await handle.done;
            sessionId = outcome.sessionId;
            error = outcome.error ?? null;
            status =
              outcome.kind === "idle"
                ? state.acceptedResultId === null
                  ? "incomplete"
                  : "completed"
                : outcome.kind === "stopped"
                  ? "stopped"
                  : "failed";
            if (status === "incomplete") error = "The agent finished without a stored analysis result";
          } catch (cause) {
            this.log(cause);
            error = "Agent execution failed; see the API log";
          }
          try {
            await finishRun(this.db, active.id, { status, error, sessionId, totals });
          } catch (cause) {
            this.log(cause);
            status = "failed";
            error = "Could not persist the run outcome; see the API log";
          }
          if (status === "failed" && error) onEvent({ type: "error", message: error });
          onEvent({ type: "run.finished", status, analysisResultId: state.acceptedResultId, error, totals });
        })
        .finally(() => {
          if (this.#active === active) this.#active = undefined;
        });
      return active.id;
    } catch (error) {
      this.#active = undefined;
      throw error;
    }
  }

  async stop(id: string) {
    await this.detail(id);
    const active = this.#active;
    if (!active || active.id !== id) throw new RunError(409, "Run is not active");
    await active.stop?.();
  }

  async close() {
    this.#closing = true;
    const active = this.#active;
    await active?.stop?.();
    await active?.done;
    await this.runner.close();
  }
}
