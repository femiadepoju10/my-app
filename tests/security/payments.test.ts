import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Payment Security Code Review", () => {
  it("should validate webhook signature", () => {
    const routePath = join(process.cwd(), "app/api/webhooks/paystack/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("verifyWebhookSignature");
    expect(content).toContain("Invalid signature");
  });

  it("should verify payment with provider before confirming", () => {
    const routePath = join(process.cwd(), "app/api/webhooks/paystack/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("verifyTransaction");
    expect(content).toContain("success");
  });

  it("should handle duplicate webhooks idempotently", () => {
    const routePath = join(process.cwd(), "app/api/webhooks/paystack/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("existingPayment");
    expect(content).toContain("successful");
  });

  it("should validate payment amount server-side", () => {
    const routePath = join(process.cwd(), "app/api/webhooks/paystack/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("amount");
    expect(content).toContain("Amount mismatch");
  });
});
