import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // The CLI (migrations) uses the direct connection when one is set.
    // `prisma generate` needs no database, so a missing value is fine for it.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
