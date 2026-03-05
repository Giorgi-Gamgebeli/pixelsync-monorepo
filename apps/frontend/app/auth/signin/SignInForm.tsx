"use client";

import { SigninSchema } from "@repo/zod";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import FormRow from "../../_components/FormRow";
import { signin } from "../../_dataAcessLayer/authActions";
import AuthButton from "../AuthButton";
import ProviderButton from "../ProviderButton";

function SignInForm() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("error") === "OAuthAccountNotLinked") {
      toast.error("Email already in use with different provider!");
    } else if (searchParams.get("verificationError")) {
      toast.error(searchParams.get("verificationError"));
    } else if (searchParams.get("verificationSuccess")) {
      toast.success(searchParams.get("verificationSuccess"));
    }
  }, []);

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm<z.infer<typeof SigninSchema>>({
    resolver: zodResolver(SigninSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof SigninSchema>) {
    startTransition(async () => {
      const res = await signin(values);

      if ("success" in res) {
        toast.success(res.success);
        reset();
      }
      if ("error" in res) toast.error(res.error);
    });
  }

  function providerSignIn(provider: "google" | "github") {
    startTransition(async () => {
      await signIn(provider, {
        callbackUrl: DEFAULT_LOGIN_REDIRECT,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-3">
        <ProviderButton
          onClick={() => providerSignIn("google")}
          disabled={isPending}
          icon="flat-color-icons:google"
        >
          Continue with Google
        </ProviderButton>
        <ProviderButton
          onClick={() => providerSignIn("github")}
          disabled={isPending}
          icon="mdi:github"
        >
          Continue with GitHub
        </ProviderButton>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-b border-gray-200" />
        <span className="text-sm text-gray-400">or</span>
        <div className="flex-1 border-b border-gray-200" />
      </div>

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="you@example.com"
        label="Email"
        type="email"
        id="email"
      />

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="Enter your password"
        label="Password"
        type="password"
        id="password"
        forgotPassword
      />

      <AuthButton disabled={isPending} marginTop>
        Sign In
      </AuthButton>
    </form>
  );
}

export default SignInForm;
