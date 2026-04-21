import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalSchemaState = globalThis as typeof globalThis & {
  stomaSqliteSchemaReady?: boolean;
};

function resolveSqliteFile() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const relativePath = url.replace(/^file:/, "");
  return path.resolve(process.cwd(), "prisma", relativePath.replace(/^\.\//, ""));
}

export function ensureSqliteSchema() {
  if (globalSchemaState.stomaSqliteSchemaReady) {
    return;
  }

  const databasePath = resolveSqliteFile();
  if (existsSync(databasePath)) {
    globalSchemaState.stomaSqliteSchemaReady = true;
    return;
  }

  const schemaSql = readFileSync(
    path.resolve(process.cwd(), "prisma/schema.sqlite.sql"),
    "utf8"
  );

  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(schemaSql);
  db.close();
  globalSchemaState.stomaSqliteSchemaReady = true;
}
