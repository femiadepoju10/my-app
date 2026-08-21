import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("MVP Acceptance Test - Code Review", () => {
  it("should have all required models in Prisma schema", () => {
    const schemaPath = join(process.cwd(), "prisma/schema.prisma");
    const content = readFileSync(schemaPath, "utf-8");

    expect(content).toContain("model users");
    expect(content).toContain("model products");
    expect(content).toContain("model productImages");
    expect(content).toContain("model transactions");
    expect(content).toContain("model payments");
    expect(content).toContain("model payouts");
    expect(content).toContain("model refunds");
    expect(content).toContain("model disputes");
    expect(content).toContain("model notifications");
  });

  it("should have transaction state machine implemented", () => {
    const routePath = join(process.cwd(), "app/api/transactions/[id]/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("VALID_STATUS_TRANSITIONS");
    expect(content).toContain("payment_pending");
    expect(content).toContain("payment_confirmed");
    expect(content).toContain("seller_contacted");
    expect(content).toContain("item_delivered");
    expect(content).toContain("inspection_pending");
    expect(content).toContain("accepted");
    expect(content).toContain("rejected");
    expect(content).toContain("disputed");
    expect(content).toContain("refund_pending");
    expect(content).toContain("refund_completed");
    expect(content).toContain("completed");
  });

  it("should have Paystack webhook integration", () => {
    const routePath = join(process.cwd(), "app/api/webhooks/paystack/route.ts");
    const content = readFileSync(routePath, "utf-8");

    expect(content).toContain("verifyWebhookSignature");
    expect(content).toContain("verifyTransaction");
    expect(content).toContain("charge.success");
  });

  it("should have notification system implemented", () => {
    const notificationsPath = join(process.cwd(), "lib/notifications.ts");
    const content = readFileSync(notificationsPath, "utf-8");

    expect(content).toContain("notifyTransactionParticipants");
    expect(content).toContain("createNotification");
  });

  it("should have admin dashboard with required sections", () => {
    const adminLayoutPath = join(process.cwd(), "app/admin/layout.tsx");
    const content = readFileSync(adminLayoutPath, "utf-8");

    expect(content).toContain("Overview");
    expect(content).toContain("Transactions");
    expect(content).toContain("Disputes");
    expect(content).toContain("Refunds");
    expect(content).toContain("Users");
  });
});
