import type { Migration } from "kysely/migration";
import * as s00_0001 from "./s00-0001-loom-meta.ts";
import * as s01_0001 from "./s01-0001-agent-runs.ts";

// Forward-only, additive migrations, named sNN-NNNN-description (ADR 0005).
// Register every migration file here; migrations.test.ts fails when one is missing.
export const migrations: Record<string, Migration> = {
  "s00-0001-loom-meta": s00_0001,
  "s01-0001-agent-runs": s01_0001,
};
