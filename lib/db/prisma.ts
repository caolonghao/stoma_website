import { PrismaClient } from "@prisma/client";
import { ensureSqliteSchema } from "@/lib/db/sqlite-schema";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

ensureSqliteSchema();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
