import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "path";

if (process.env.NODE_ENV !== "production") {
  config({ path: path.join(process.cwd(), ".env.local") });
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
