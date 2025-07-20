"use server";

import { signIn } from "@/auth";
import {
  NewPasswordSchema,
  ResetPasswordSchema,
  SigninSchema,
  SignupSchema,
} from "../_schemas/authSchemas";
import { db } from "./db";
import { hash } from "bcryptjs";
import { z } from "zod";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import {
  generateResetPasswordToken,
  generateVerificationToken,
} from "./tokens";
import { sendResetPasswordEmail, sendVerificationEmail } from "../_lib/mail";
import { handleErrorsOnServer } from "../_utils/helpers";
import { getVerificationTokenByToken } from "./verificationToken";

export async function signin(values: z.infer<typeof SigninSchema>): Promise<
  | {
      error: string;
    }
  | {
      success: string;
    }
> {
  const result = SigninSchema.safeParse(values);

  try {
    if (!result.success) throw new Error("Invalid credentials!");

    const { email, password } = result.data;

    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        password: true,
        emailVerified: true,
        userName: true,
      },
    });

    if (!existingUser) throw new Error("Email does not exist!");

    if (!existingUser.password)
      throw new Error("Email already in use with different provider!");

    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(
        existingUser.email,
      );

      await sendVerificationEmail(
        existingUser.userName || "unknown",
        existingUser.email,
        verificationToken.token,
      );

      return { success: "Confirmation email sent!" };
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });

    return { success: "Successfully signed in!" };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function signup(values: z.infer<typeof SignupSchema>): Promise<
  | {
      error: string;
    }
  | {
      success: string;
    }
> {
  const result = SignupSchema.safeParse(values);

  try {
    if (!result.success) throw new Error("Validation failed on server");

    const { email, password, userName } = result.data;

    const isEmailUsed = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
      },
    });

    if (isEmailUsed) return { error: "Email already in use" };

    const isUserNameUsed = await db.user.findUnique({
      where: {
        userName: userName,
      },
      select: {
        userName: true,
      },
    });

    if (isUserNameUsed) return { error: "Username already in use" };

    const hashedPassword = await hash(password, 12);

    await db.user.create({
      data: {
        userName,
        email,
        password: hashedPassword,
        name: userName,
      },
    });

    const verificationToken = await generateVerificationToken(email);

    await sendVerificationEmail(userName, email, verificationToken.token);

    return { success: "Confirmation email sent!" };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function newVerification(token: string) {
  try {
    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) throw new Error("Token does not exist!");

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) throw new Error("Token has expired!");

    const existingUser = await db.user.findUnique({
      where: {
        email: existingToken.email,
      },
    });

    if (!existingUser) throw new Error("Email does not exist!");

    await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });

    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });

    return { success: "Email verfiied!" };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function resetPassword(
  values: z.infer<typeof ResetPasswordSchema>,
): Promise<
  | {
      error: string;
    }
  | {
      success: string;
    }
> {
  const result = ResetPasswordSchema.safeParse(values);

  try {
    if (!result.success) throw new Error("Validation failed on server!");

    const { email } = result.data;

    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        userName: true,
      },
    });

    if (!existingUser) throw new Error("Email not found!");

    const resetPasswordToken = await generateResetPasswordToken(email);

    await sendResetPasswordEmail(
      existingUser.userName || "Unknown",
      resetPasswordToken.email,
      resetPasswordToken.token,
    );

    return { success: "Reset email sent!" };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}

export async function newPassword(
  values: z.infer<typeof NewPasswordSchema>,
): Promise<
  | {
      error: string;
    }
  | {
      success: string;
    }
> {
  const result = NewPasswordSchema.safeParse(values);

  try {
    if (!result.success) throw new Error("Validation failed on server!");

    const { password, token } = result.data;

    const existingToken = await db.resetPasswordToken.findFirst({
      where: {
        token,
      },
      select: {
        id: true,
        email: true,
        expires: true,
      },
    });

    if (!existingToken) throw new Error("Invaild token!");

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) throw new Error("Token has expired!");

    const existingUser = await db.user.findUnique({
      where: {
        email: existingToken.email,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) throw new Error("Email does not exist!");

    const hashedPassword = await hash(password, 12);

    await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    await db.resetPasswordToken.delete({
      where: {
        id: existingToken.id,
      },
    });

    return { success: "Password has been reset!" };
  } catch (error) {
    return handleErrorsOnServer(error);
  }
}
