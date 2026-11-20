import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { logServerEvent } from "./log";

/**
 * Server-only Prisma client for the lead database (Supabase Postgres).
 *
 * - DATABASE_URL: Supavisor *transaction* mode (port 6543), suited to
 *   serverless functions. Prepared statements are not cached by the adapter,
 *   so it is safe behind the transaction pooler.
 * - DATABASE_SSL_CA (recommended): Supabase's CA certificate (PEM). When set,
 *   the server certificate is fully verified; otherwise the connection is
 *   encrypted but the certificate chain is not verified.
 *
 * The client is created lazily on first use, so builds and prerendering never
 * open a database connection.
 */

export class DatabaseNotConfiguredError extends Error {
  name = "DatabaseNotConfiguredError";
}

const globalForDb = globalThis as typeof globalThis & { __aureliaDb?: PrismaClient };

function createClient(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new DatabaseNotConfiguredError("DATABASE_URL is not set");

  const url = new URL(raw);
  // TLS is configured explicitly below; drop libpq-style params pg would reinterpret.
  for (const p of ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat", "schema", "pgbouncer"]) {
    url.searchParams.delete(p);
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n").trim();

  const adapter = new PrismaPg(
    {
      connectionString: url.toString(),
      ssl: local ? undefined : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
      // Small pool per serverless instance; Supavisor multiplexes upstream.
      max: Number(process.env.DATABASE_POOL_MAX ?? 3),
      connectionTimeoutMillis: 8_000,
      idleTimeoutMillis: 10_000,
      query_timeout: 10_000,
    },
    {
      schema: "aurelia",
      onPoolError: (e) => logServerEvent("db.pool_error", e),
      onConnectionError: (e) => logServerEvent("db.connection_error", e),
    },
  );
  return new PrismaClient({ adapter });
}

export function getDb(): PrismaClient {
  globalForDb.__aureliaDb ??= createClient();
  return globalForDb.__aureliaDb;
}
