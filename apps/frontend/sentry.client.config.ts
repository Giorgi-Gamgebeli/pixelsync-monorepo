import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
  // Capture 100% of errors, sample 20% of transactions for performance
  tracesSampleRate: 0.2,
  // Don't send PII like user IPs
  sendDefaultPii: false,
  // Ignore common noise
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "AbortError",
    "Network request failed",
  ],
});
