import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";
import { sendSms } from "@/lib/sms";

const NOTIFICATION_TITLES: Record<string, string> = {
  payment: "Payment Update",
  transaction: "Transaction Update",
  payout: "Payout Update",
  dispute: "Dispute Alert",
  refund: "Refund Update",
  message: "New Message",
  admin: "Admin Notification",
  review: "New Review",
  delivery: "Delivery Update",
};

const SMS_TYPES = new Set(["payment", "dispute", "refund", "payout", "delivery"]);

async function notifyAdmin(type: string, message: string) {
  try {
    const admins = await db.users.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notifications.create({
        data: {
          userId: admin.id,
          type: "admin",
          message: `[Admin] ${message}`,
        },
      });
    }
  } catch {
    // silent fail
  }
}

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await db.notifications.create({
      data: {
        userId,
        type,
        message,
      },
    });
  } catch {
    // silent fail — notifications are non-critical
  }

  try {
    await sendPushNotification(userId, {
      title: NOTIFICATION_TITLES[type] || "PassitOn Notification",
      body: message,
      data: data || {},
    });
  } catch {
    // silent fail — push notifications are non-critical
  }

  try {
    if (SMS_TYPES.has(type)) {
      await sendSms(userId, type, message);
    }
  } catch {
    // silent fail — SMS notifications are non-critical
  }
}

export async function notifyTransactionParticipants(
  transactionId: string,
  type: string,
  extraMessage?: string
) {
  try {
    const transaction = await db.transactions.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        product: { select: { title: true } },
      },
    });

    if (!transaction) return;

    const productTitle = transaction.product?.title || "a product";

    const messageMap: Record<string, (tx: NonNullable<typeof transaction>) => string> = {
      payment_confirmed: (tx) =>
        `Payment confirmed for ${productTitle}. The seller has been notified.`,
      seller_contacted: (tx) =>
        `Your item ${productTitle} has been purchased! Please contact the buyer.`,
      item_delivered: (tx) =>
        `The seller has marked ${productTitle} as delivered. Please inspect it.`,
      inspection_pending: (tx) =>
        `Please inspect ${productTitle} and confirm acceptance or report a problem.`,
      accepted: (tx) =>
        `You have accepted ${productTitle}. The seller payout is being processed.`,
      payout_pending: (tx) =>
        `Payout of ${tx.itemPrice} for ${productTitle} is being processed.`,
      payout_initiated: (tx) =>
        `Payout of ${tx.itemPrice} for ${productTitle} has been initiated via Paystack.`,
      payout_completed: (tx) =>
        `Your payout for ${productTitle} has been completed.`,
      rejected: (tx) =>
        `The buyer has reported a problem with ${productTitle}.${tx.rejectionReason ? ` Reason: ${tx.rejectionReason}` : ""}`,
      disputed: (tx) =>
        `Transaction for ${productTitle} has been disputed.`,
      refund_pending: (tx) =>
        `A refund for ${productTitle} is being processed.`,
      refund_initiated: (tx) =>
        `A refund for ${productTitle} has been initiated via Paystack.`,
      refund_completed: (tx) =>
        `Your refund for ${productTitle} has been processed.`,
      refund_failed: (tx) =>
        `Refund for ${productTitle} failed. Please contact support for assistance.`,
      completed: (tx) =>
        `Transaction for ${productTitle} has been completed successfully.`,
    };

    const getMessage = messageMap[type] || ((tx) => `Transaction #${tx.id} status updated to ${type}.`);
    const message = getMessage(transaction) + (extraMessage ? ` ${extraMessage}` : "");

    switch (type) {
      case "payment_confirmed":
        await createNotification(transaction.buyerId, "payment", message, {
          url: `/transaction/${transactionId}`,
        });
        await createNotification(transaction.sellerId, "payment", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "seller_contacted":
        await createNotification(transaction.sellerId, "transaction", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "item_delivered":
        await createNotification(transaction.buyerId, "transaction", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "inspection_pending":
        await createNotification(transaction.buyerId, "transaction", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "accepted":
        await createNotification(transaction.buyerId, "transaction", message, {
          url: `/transaction/${transactionId}`,
        });
        await createNotification(transaction.sellerId, "payout", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "payout_pending":
        await createNotification(transaction.sellerId, "payout", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "payout_completed":
        await createNotification(transaction.sellerId, "payout", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
      case "payout_initiated":
        await createNotification(transaction.sellerId, "payout", message, {
          url: `/transaction/${transactionId}`,
        });
        break;
    case "rejected":
      await createNotification(transaction.sellerId, "dispute", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.buyerId, "dispute", message, {
        url: `/transaction/${transactionId}`,
      });
      await notifyAdmin("dispute", message);
      break;
    case "disputed":
      await createNotification(transaction.buyerId, "dispute", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.sellerId, "dispute", message, {
        url: `/transaction/${transactionId}`,
      });
      await notifyAdmin("dispute", message);
      break;
    case "refund_pending":
      await createNotification(transaction.buyerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.sellerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      await notifyAdmin("refund", message);
      break;
    case "refund_completed":
      await createNotification(transaction.buyerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.sellerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      break;
    case "refund_initiated":
      await createNotification(transaction.buyerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.sellerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      break;
    case "refund_failed":
      await createNotification(transaction.buyerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.sellerId, "refund", message, {
        url: `/transaction/${transactionId}`,
      });
      break;
    case "completed":
      await createNotification(transaction.buyerId, "transaction", message, {
        url: `/transaction/${transactionId}`,
      });
      await createNotification(transaction.sellerId, "transaction", message, {
        url: `/transaction/${transactionId}`,
      });
      break;
      default:
        break;
    }
  } catch {
    // silent fail
  }
}
