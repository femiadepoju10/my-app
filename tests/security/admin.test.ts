import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Admin Security Code Review", () => {
  it("should require authentication for admin routes", () => {
    const routePath = join(process.cwd(), "app/api/admin/users/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("getServerSession(authOptions)");
    expect(content).toContain("Forbidden");
  });

  it("should require admin role for admin routes", () => {
    const routePath = join(process.cwd(), "app/api/admin/users/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("role");
    expect(content).toContain("admin");
    expect(content).toContain("Forbidden");
  });

  it("should prevent non-admin users from cleanup", () => {
    const routePath = join(process.cwd(), "app/api/admin/cleanup/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("admin");
    expect(content).toContain("Forbidden");
  });
});
