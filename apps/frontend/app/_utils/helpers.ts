import { AuthError } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";

/**
 * Marks an error as intentional / user-facing.
 * Its message is safe to show in the UI.
 */
export class OperationalError extends Error {}

/**
 * Central error handler for server actions.
 *
 * - Operational errors (thrown intentionally): message returned to user as-is.
 * - Auth credential errors: mapped to "Invalid credentials".
 * - Everything else: reported to Sentry, user sees generic message.
 */
export function handleErrorsOnServer(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }

  if (error instanceof AuthError && error.type === "CredentialsSignin") {
    return { error: "Invalid credentials" };
  }

  if (error instanceof OperationalError) {
    return { error: error.message };
  }

  // Unexpected error — hide details from user
  Sentry.captureException(error);
  return { error: "Something went wrong!" };
}

export function generateUsername() {
  const animals = [
    "lion",
    "tiger",
    "bear",
    "wolf",
    "fox",
    "eagle",
    "shark",
    "panda",
    "koala",
    "zebra",
    "rhino",
    "falcon",
    "otter",
    "giraffe",
    "leopard",
  ];

  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const randomNumbers = Math.floor(100000 + Math.random() * 900000);
  return `${randomAnimal}${randomNumbers}`;
}
