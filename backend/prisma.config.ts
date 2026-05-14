import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node ./prisma/seed.ts",
  },
  datasource: {
    // Prisma 7 uses this url for Migrate/CLI. 
    // We use DIRECT_URL (port 5432) to ensure a session-mode connection over IPv4.
    url: process.env["DIRECT_URL"],
  },
});
