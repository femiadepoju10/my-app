import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "path";

if (process.env.NODE_ENV !== "production") {
  config({ path: path.join(process.cwd(), ".env.local") });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Set it in your Vercel environment variables, or create a .env.local file for local development."
  );
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
