import type { SubmitAnalysisInput } from "@loom/contracts";
import type { ColumnType, Generated } from "kysely";

// Hand-written database types (ADR 0005). Keep in step with src/migrations;
// persistence.int.test.ts compares these tables and columns with information_schema.

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export interface LoomMetaTable {
  key: string;
  value: string;
  updated_at: Timestamp;
}

export interface AgentRunsTable {
  id: string;
  task: string;
  status: "running" | "completed" | "incomplete" | "failed" | "stopped";
  client_profile: "workshop" | "production";
  model: string | null;
  session_id: string | null;
  started_at: Timestamp;
  finished_at: ColumnType<Date | null, Date | string | null | undefined, Date | string | null>;
  error: string | null;
  model_calls: Generated<number>;
  input_tokens: Generated<number>;
  output_tokens: Generated<number>;
  tool_calls: Generated<number>;
  denied_tool_calls: Generated<number>;
}

export interface AnalysisResultsTable {
  id: ColumnType<string, never, never>;
  agent_run_id: string;
  /** jsonb: written as a JSON string, read as a parsed object. */
  result: ColumnType<SubmitAnalysisInput, string, string>;
  created_at: Timestamp;
}

export interface Database {
  loom_meta: LoomMetaTable;
  agent_runs: AgentRunsTable;
  analysis_results: AnalysisResultsTable;
}

/** Tables and columns declared above, in column order, used by the schema consistency test. */
export const declaredColumns: Record<keyof Database, string[]> = {
  agent_runs: [
    "id",
    "task",
    "status",
    "client_profile",
    "model",
    "session_id",
    "started_at",
    "finished_at",
    "error",
    "model_calls",
    "input_tokens",
    "output_tokens",
    "tool_calls",
    "denied_tool_calls",
  ],
  analysis_results: ["id", "agent_run_id", "result", "created_at"],
  loom_meta: ["key", "value", "updated_at"],
};
