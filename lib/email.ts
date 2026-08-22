import { Resend } from "resend";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "PassitOn <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("\n📧 EMAIL WOULD BE SENT:");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  Preview:", html.replace(/<[^>]+>/g, "").substring(0, 200) + "...");
    console.log("");
    return;
  }

  await resend.emails.send({ from: FROM, to, subject, html });
}

function emailWrapper(title: string, body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #18181b; margin-bottom: 8px;">${title}</h2>
      <div style="color: #52525b; font-size: 14px; line-height: 1.6;">${body}</div>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #a1a1aa; font-size: 12px;">PassitOn — Secure Marketplace</p>
    </div>
  `;
}

async function getTransactionData(transactionId: string) {
  const tx = await db.transactions.findUnique({
    where: { id: transactionId },
  });

  if (!tx) return null;

  const product = await db.products.findUnique({
    where: { id: tx.productId },
  });

  const buyer = await db.users.findUnique({
    where: { id: tx.buyerId },
  });

  const seller = await db.users.findUnique({
    where: { id: tx.sellerId },
  });

  return { tx, product, buyer, seller };
}

export async function sendTransactionEmail(
  transactionId: string,
  type: string
) {
  const data = await getTransactionData(transactionId);
  if (!data) return;

  const { tx, product, buyer, seller } = data;
  const productName = product?.title || "Unknown Product";

  let to = "";
  let subject = "";
  let html = "";

  switch (type) {
    case "payment_confirmed":
      to = buyer?.email || "";
      subject = `Payment Confirmed — ${productName}`;
      html = emailWrapper(
        "Payment Confirmed",
        `<p>Hi ${buyer?.name},</p>
         <p>Your payment of <strong>${formatPrice(tx.totalAmount, tx.currency)}</strong> for <strong>${productName}</strong> has been confirmed.</p>
         <p>The seller has been notified and will arrange handover with you.</p>`
      );
      break;

    case "seller_contacted":
      to = seller?.email || "";
      subject = `Your item was purchased — ${productName}`;
      html = emailWrapper(
        "Item Sold!",
        `<p>Hi ${seller?.name},</p>
         <p>Your item <strong>${productName}</strong> has been purchased!</p>
         <p>Payment of <strong>${formatPrice(tx.totalAmount, tx.currency)}</strong> has been secured. Please contact the buyer to arrange handover.</p>`
      );
      break;

    case "item_delivered":
      to = buyer?.email || "";
      subject = `Item Handed Over — ${productName}`;
      html = emailWrapper(
        "Item Handed Over",
        `<p>Hi ${buyer?.name},</p>
         <p>The seller has confirmed that <strong>${productName}</strong> has been handed over to you.</p>
         <p>Please inspect the item and confirm acceptance, or report any problems.</p>`
      );
      break;

    case "item_accepted":
      to = seller?.email || "";
      subject = `Item Accepted — ${productName}`;
      html = emailWrapper(
        "Item Accepted",
        `<p>Hi ${seller?.name},</p>
         <p>The buyer has accepted <strong>${productName}</strong>.</p>
         <p>Your payout of <strong>${formatPrice(tx.itemPrice, tx.currency)}</strong> is now being processed.</p>`
      );
      break;

    case "payout_completed":
      to = seller?.email || "";
      subject = `Payout Completed — ${formatPrice(tx.itemPrice, tx.currency)}`;
      html = emailWrapper(
        "You've Been Paid!",
        `<p>Hi ${seller?.name},</p>
         <p>Your payout of <strong>${formatPrice(tx.itemPrice, tx.currency)}</strong> for <strong>${productName}</strong> has been completed.</p>
          <p>Thank you for selling on PassitOn!</p>`
      );
      break;

    case "refund_completed":
      to = buyer?.email || "";
      subject = `Refund Processed — ${formatPrice(tx.totalAmount, tx.currency)}`;
      html = emailWrapper(
        "Refund Processed",
        `<p>Hi ${buyer?.name},</p>
         <p>Your refund of <strong>${formatPrice(tx.totalAmount, tx.currency)}</strong> for <strong>${productName}</strong> has been processed.</p>
         <p>The funds will be returned to your original payment method.</p>`
      );
      break;

    case "payout_initiated":
      to = seller?.email || "";
      subject = `Payout Initiated — ${formatPrice(tx.itemPrice, tx.currency)}`;
      html = emailWrapper(
        "Payout Initiated",
        `<p>Hi ${seller?.name},</p>
         <p>Your payout of <strong>${formatPrice(tx.itemPrice, tx.currency)}</strong> for <strong>${productName}</strong> has been initiated.</p>
         <p>The funds will be transferred to your bank account shortly.</p>`
      );
      break;

    case "refund_initiated":
      to = buyer?.email || "";
      subject = `Refund Initiated — ${formatPrice(tx.totalAmount, tx.currency)}`;
      html = emailWrapper(
        "Refund Initiated",
        `<p>Hi ${buyer?.name},</p>
         <p>Your refund of <strong>${formatPrice(tx.totalAmount, tx.currency)}</strong> for <strong>${productName}</strong> is being processed.</p>
         <p>You will receive a confirmation once the refund is completed.</p>`
      );
      break;

    case "refund_failed":
      to = buyer?.email || "";
      subject = `Refund Failed — Please Contact Support`;
      html = emailWrapper(
        "Refund Failed",
        `<p>Hi ${buyer?.name},</p>
         <p>We attempted to process your refund of <strong>${formatPrice(tx.totalAmount, tx.currency)}</strong> for <strong>${productName}</strong>, but it failed.</p>
         <p>Please contact our support team for assistance. Your transaction has been flagged for manual review.</p>`
      );
      break;

    case "item_rejected":
      to = seller?.email || "";
      subject = `Item Rejected — ${productName}`;
      html = emailWrapper(
        "Item Rejected",
        `<p>Hi ${seller?.name},</p>
         <p>The buyer has reported a problem with <strong>${productName}</strong>.</p>
         ${tx.rejectionReason ? `<p><strong>Reason:</strong> ${tx.rejectionReason}</p>` : ""}
         <p>Please check the transaction for details.</p>`
      );
      break;

    default:
      return;
  }

  if (!to) return;

  try {
    await sendEmail(to, subject, html);
  } catch {
    // Silent fail — emails are non-critical
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
  baseUrl: string
) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendEmail(
      email,
      "Reset your PassitOn password",
      emailWrapper(
        "Reset Your Password",
        `<p>Hi ${name},</p>
         <p>We received a request to reset your password. Click the link below to set a new password:</p>
         <p><a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p>
         <p>This link expires in 1 hour.</p>
         <p>If you didn't request this, you can safely ignore this email.</p>`
      )
    );
  } catch {
    // Silent fail
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await sendEmail(
      email,
      "Welcome to PassitOn!",
       emailWrapper(
         "Welcome to PassitOn!",
         `<p>Hi ${name},</p>
          <p>Welcome to PassitOn! Your account has been created successfully.</p>
         <p>You can now browse products, make purchases, and start selling.</p>
         <p>If you have any questions, feel free to reach out to our support team.</p>`
      )
    );
  } catch {
    // Silent fail
  }
}
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  baseUrl: string
) {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  try {
    await sendEmail(
      email,
      "Verify your PassitOn email",
       emailWrapper(
         "Verify Your Email",
         `<p>Hi ${name},</p>
          <p>Welcome to PassitOn! Please verify your email address by clicking the link below:</p>
         <p><a href="${verifyUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a></p>
         <p>This link expires in 24 hours.</p>
         <p>If you didn't create an account, you can safely ignore this email.</p>`
      )
    );
  } catch {
    // Silent fail
  }
}
