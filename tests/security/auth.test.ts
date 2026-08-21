import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Authentication Security Code Review", () => {
  it("should have auth guards in transaction API routes", () => {
    const routePath = join(process.cwd(), "app/api/transactions/[id]/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("getServerSession(authOptions)");
    expect(content).toContain("Unauthorized");
    expect(content).toContain("Forbidden");
  });

  it("should verify transaction ownership before allowing updates", () => {
    const routePath = join(process.cwd(), "app/api/transactions/[id]/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("buyerId");
    expect(content).toContain("sellerId");
    expect(content).toContain("isBuyer");
    expect(content).toContain("isSeller");
  });

  it("should hash passwords using bcrypt", () => {
    const routePath = join(process.cwd(), "app/api/auth/signup/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("bcrypt.hash");
    expect(content).not.toContain("plaintext");
    expect(content).not.toContain("password123");
  });

  it("should have role-based access control in admin routes", () => {
    const adminRoutePath = join(process.cwd(), "app/api/admin/users/route.ts");
    const content = readFileSync(adminRoutePath, "utf-8");

    expect(content).toContain("role");
    expect(content).toContain("admin");
    expect(content).toContain("Forbidden");
  });
});
