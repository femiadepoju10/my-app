const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "PAYSTACK_SECRET_KEY",
  "PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
] as const;

export function validateEnv(throwOnError = true) {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message =
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\nAdd them to .env.local and restart the dev server.`;

    if (throwOnError) {
      throw new Error(message);
    }

    console.warn(message);
  }
}

export function warnEnv() {
  validateEnv(false);
}
