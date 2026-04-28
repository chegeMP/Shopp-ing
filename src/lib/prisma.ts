import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Use when DATA_SOURCE=database. Prefer from server / API routes only. */
export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set when DATA_SOURCE=database");
  }

  globalForPrisma.prisma = new PrismaClient();
  return globalForPrisma.prisma;
}
