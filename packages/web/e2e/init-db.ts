import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const dbPath = process.env.DATABASE_URL;

if (!dbPath) {
  throw new Error("DATABASE_URL must be set for E2E DB initialization.");
}

const migrationPath = path.join(
  repoRoot,
  "packages/api/drizzle/0000_adorable_landau.sql"
);
const migrationSql = readFileSync(migrationPath, "utf8");
const statements = migrationSql
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

const db = new Database(path.join(repoRoot, dbPath));

try {
  db.exec("PRAGMA foreign_keys = ON;");
  for (const statement of statements) {
    db.exec(statement);
  }
} finally {
  db.close();
}
