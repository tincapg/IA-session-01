import { loadConfig } from "@loom/config";
import { createDatabase, seed } from "@loom/persistence";

const config = loadConfig();
const db = createDatabase(config.databaseUrl, { maxConnections: 1 });

try {
  const { upserted } = await seed(db);
  console.log(`✓ seeded ${upserted} rows`);
} finally {
  await db.destroy();
}
