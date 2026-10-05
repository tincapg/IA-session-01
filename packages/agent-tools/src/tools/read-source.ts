import { defineTool } from "@github/copilot-sdk";
import { ReadSourceInput, type ReadSourceResult } from "@loom/contracts";
import { z } from "zod";
import type { ToolContext } from "./context.ts";
import { failure, guarded } from "./results.ts";

/** Read-only: returns the content of one declared source, identified by ID. */
export const readSourceTool = (ctx: ToolContext) =>
  defineTool("read_source", {
    description: "Read the content of one workspace source. Use an ID returned by list_sources.",
    parameters: ReadSourceInput,
    defer: "never",
    handler: (args) =>
      guarded<ReadSourceResult>("read_source", ctx.log, async () => {
        void z;
        throw new Error("TODO(session-01): validate sourceId, reject paths and unknown IDs, record the read");
      }),
  });
