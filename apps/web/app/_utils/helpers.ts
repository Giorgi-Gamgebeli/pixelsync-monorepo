import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export function handleErrorsOnServer(error: unknown) {
  console.error(error);

  let message: string;

  if (isRedirectError(error)) {
    throw error;
  } else if (error instanceof AuthError && error.type === "CredentialsSignin") {
    message = "Invalid credentials";
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "Something went wrong!";
  }

  return { error: message };
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
