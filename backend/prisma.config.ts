import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node ./prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL bypasses PgBouncer for CLI operations (migrate, generate, seed).
    // The runtime PrismaService uses DATABASE_URL via the @prisma/adapter-pg pool.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
