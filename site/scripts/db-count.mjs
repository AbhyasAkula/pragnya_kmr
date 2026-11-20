// Prints row counts for the aurelia schema (no row contents). Usage: node scripts/db-count.mjs
import pg from "pg";
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
const u = new URL(process.env.DIRECT_URL);
for (const p of ["sslmode", "schema"]) u.searchParams.delete(p);
const c = new pg.Client({ connectionString: u.toString(), ssl: { rejectUnauthorized: false } });
await c.connect();
const { rows } = await c.query(
  "select relname as table from pg_class where relnamespace = 'aurelia'::regnamespace and relkind = 'r' order by 1",
);
for (const { table } of rows) {
  const r = await c.query(`select count(*)::int as n from aurelia."${table}"`);
  console.log(`${table.padEnd(26)} ${r.rows[0].n}`);
}
await c.end();
