import "dotenv/config";
import { defineConfig } from "prisma/config";

// Ensure we always use the IPv4 Supavisor Session Mode pooler (port 5432) with the correct tenant identifier (postgres.txigkdpujvmdbscheyev) for CLI/migrations,
// because Render build environments are IPv4-only and cannot reach Supabase IPv6 direct hosts (db.*.supabase.co).
const getCliUrl = () => {
  const direct = process.env["DIRECT_URL"];
  const db = process.env["DATABASE_URL"];
  
  if (direct && direct.includes("db.txigkdpujvmdbscheyev.supabase.co")) {
    // Replace direct host with Supavisor pooler AND ensure username has the tenant identifier (.txigkdpujvmdbscheyev)
    return direct
      .replace("db.txigkdpujvmdbscheyev.supabase.co", "aws-1-ap-south-1.pooler.supabase.com")
      .replace("postgresql://postgres:", "postgresql://postgres.txigkdpujvmdbscheyev:");
  }
  if (direct && direct.includes("aws-1-ap-south-1.pooler.supabase.com")) {
    return direct.replace("postgresql://postgres:", "postgresql://postgres.txigkdpujvmdbscheyev:");
  }
  if (db) {
    return db.replace(":6543", ":5432").replace("?pgbouncer=true", "").replace("&pgbouncer=true", "");
  }
  return direct;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node ./prisma/seed.ts",
  },
  datasource: {
    url: getCliUrl(),
  },
});
