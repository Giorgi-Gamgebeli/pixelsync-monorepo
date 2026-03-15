"use server";

import { auth } from "@/auth";
import * as jwt from "jsonwebtoken";
import { handleErrorsOnServer } from "../_utils/helpers";

export async function getWebSocketTicket() {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated!");

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");

    // Create a very short-lived token (30 seconds) just for establishing the WS connection.
    // We include the same user data as the main session token.
    const ticket = jwt.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        name: session.user.name,
        userName: session.user.userName,
        avatarConfig: session.user.avatarConfig,
        image: session.user.image,
      },
      secret,
      { expiresIn: "30s" }
    );

    return ticket;
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}
