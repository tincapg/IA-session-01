import { loadConfig } from "@loom/config";
import { sql } from "kysely";
import { createDatabase, type LoomDatabase } from "./database.ts";
import { MIGRATION_LOCK_TABLE, MIGRATION_TABLE } from "./migrate.ts";
import { isSQLite } from "./sqlite.ts";

/** Opens the test database configured through DATABASE_URL_TEST or derived from DATABASE_URL. */
export function openTestDatabase(): LoomDatabase {
  return createDatabase(loadConfig().testDatabaseUrl, { maxConnections: 2 });
}

/** Empties every application table, keeping the migration bookkeeping. */
export async function truncateAll(db: LoomDatabase): Promise<void> {
  if (isSQLite(db)) {
    await db.transaction().execute(async (tx) => {
      await tx.deleteFrom("analysis_results").execute();
      await tx.deleteFrom("agent_runs").execute();
      await tx.deleteFrom("loom_meta").execute();
      await sql`delete from sqlite_sequence where name = 'analysis_results'`.execute(tx);
    });
    return;
  }
  const tables = await sql<{ tablename: string }>`
    select tablename from pg_tables
    where schemaname = 'public' and tablename not in (${MIGRATION_TABLE}, ${MIGRATION_LOCK_TABLE})
  `.execute(db);
  if (tables.rows.length === 0) return;
  const list = sql.join(tables.rows.map((row) => sql.table(row.tablename)));
  await sql`truncate ${list} restart identity cascade`.execute(db);
}
