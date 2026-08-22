import { db } from "@/lib/db";

export type DisputeCategory = "not_received" | "not_as_described" | "damaged" | "shipping_delay" | "other";

interface KeywordRule {
  category: DisputeCategory;
  keywords: string[];
}

const DISPUTE_KEYWORD_RULES: KeywordRule[] = [
  { category: "not_received", keywords: ["not received", "never arrived", "no delivery", "haven't received", "hasn't arrived", "did not receive", "missing", "no show"] },
  { category: "not_as_described", keywords: ["not as described", "wrong item", "different", "fake", "counterfeit", "misrepresented", "not original", "not what i ordered"] },
  { category: "damaged", keywords: ["damage", "broken", "cracked", "torn", "defective", "dented", "scratched", "blemish", "ruined", "not working"] },
  { category: "shipping_delay", keywords: ["shipping delay", "late", "took too long", "delayed", "slow shipping", "delivery took", "still waiting"] },
];

export function autoTriage(reason: string): DisputeCategory {
  const normalized = reason.toLowerCase().trim();
  for (const rule of DISPUTE_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.category;
    }
  }
  return "other";
}

interface RiskScoreParams {
  sellerId: string;
  buyerId: string;
  transactionAmount: number;
}

const RISK_THRESHOLD_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const AUTO_RESOLVE_AMOUNT_THRESHOLD = 500000; // 5,000 in minor units = $50 at 1:100

export async function computeRiskScore(params: RiskScoreParams): Promise<number> {
  const { sellerId, buyerId, transactionAmount } = params;
  const thirtyDaysAgo = new Date(Date.now() - RISK_THRESHOLD_30_DAYS);

  let score = 0;

  const sellerDisputes = await db.disputes.count({
    where: {
      transaction: { sellerId },
      status: { in: ["refunded", "seller_paid", "admin_reviewing"] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  if (sellerDisputes > 3) score += 30;

  const sellerCompletedCount = await db.transactions.count({
    where: { sellerId, status: "completed" },
  });

  if (sellerCompletedCount < 5) score += 15;

  const sellerTotalTransactions = await db.transactions.count({
    where: { sellerId },
  });

  if (sellerTotalTransactions > 0) {
    const sellerDisputeRate = sellerDisputes / sellerTotalTransactions;
    if (sellerDisputeRate > 0.3) score += 20;
  }

  if (transactionAmount > 500000) score += 10;

  const buyerDisputes = await db.disputes.count({
    where: {
      openedById: buyerId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  if (buyerDisputes > 5) score += 25;

  const buyerTotalDisputes = await db.disputes.count({
    where: { openedById: buyerId },
  });

  const buyerWonDisputes = await db.disputes.count({
    where: { openedById: buyerId, status: "refunded" },
  });

  if (buyerTotalDisputes >= 3) {
    const buyerWinRate = buyerWonDisputes / buyerTotalDisputes;
    if (buyerWinRate > 0.8) score += 15;
  }

  return Math.min(Math.max(score, 0), 100);
}

interface ResolutionSuggestion {
  action: "refund" | "partial_refund" | "manual_review";
  autoResolved: boolean;
  reason: string;
}

export function suggestResolution(score: number, category: DisputeCategory): ResolutionSuggestion {
  if (score <= 20 && ["not_received", "damaged", "not_as_described"].includes(category)) {
    return { action: "refund", autoResolved: true, reason: `Low risk (${score}) and clear-cut category (${category})` };
  }
  if (score <= 35 && category === "shipping_delay") {
    return { action: "partial_refund", autoResolved: true, reason: `Low risk (${score}) shipping delay; partial refund suggested` };
  }
  if (score >= 75) {
    return { action: "manual_review", autoResolved: false, reason: `High risk (${score}); requires manual review` };
  }
  return { action: "manual_review", autoResolved: false, reason: `Score ${score} within manual review range` };
}

export interface DisputeAutomationResult {
  autoTriageCategory: string;
  riskScore: number;
  suggestedResolution: string;
  autoResolved: boolean;
  autoResolvedAt: Date | null;
}

export async function processDisputeAutomation(
  transactionId: string,
  reason: string
): Promise<DisputeAutomationResult> {
  const category = autoTriage(reason);

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
    select: {
      sellerId: true,
      buyerId: true,
      totalAmount: true,
      itemPrice: true,
    },
  });

  if (!transaction) {
    return {
      autoTriageCategory: category,
      riskScore: 0,
      suggestedResolution: "manual_review",
      autoResolved: false,
      autoResolvedAt: null,
    };
  }

  const score = await computeRiskScore({
    sellerId: transaction.sellerId,
    buyerId: transaction.buyerId,
    transactionAmount: transaction.totalAmount,
  });

  const suggestion = suggestResolution(score, category);
  const now = new Date();

  return {
    autoTriageCategory: category,
    riskScore: score,
    suggestedResolution: suggestion.action,
    autoResolved: suggestion.autoResolved,
    autoResolvedAt: suggestion.autoResolved ? now : null,
  };
}
