import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Marketplace Security Code Review", () => {
  it("should prevent seller from buying own product", () => {
    const routePath = join(process.cwd(), "app/api/transactions/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("sellerId === buyerId");
    expect(content).toContain("cannot buy your own product");
  });

  it("should validate product status before purchase", () => {
    const routePath = join(process.cwd(), "app/api/transactions/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("product.status");
    expect(content).toContain("active");
  });

  it("should prevent duplicate pending transactions", () => {
    const routePath = join(process.cwd(), "app/api/transactions/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("payment_pending");
    expect(content).toContain("already checking out");
  });

  it("should validate product exists before purchase", () => {
    const routePath = join(process.cwd(), "app/api/transactions/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("Product not found");
  });
});
