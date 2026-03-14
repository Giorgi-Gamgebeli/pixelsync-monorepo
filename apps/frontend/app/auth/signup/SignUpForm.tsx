"use client";

import FormRow from "../../_components/FormRow";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "@repo/zod";
import { signup } from "../../_dataAccessLayer/authActions";
import { useTransition } from "react";
import AuthButton from "../AuthButton";
import ProviderButton from "@/app/auth/ProviderButton";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

function SignUpForm() {
  const [isPending, startTransition] = useTransition();

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      userName: "",
      password: "",
      passwordConfirm: "",
    },
  });

  function onSubmit(values: z.infer<typeof SignupSchema>) {
    startTransition(async () => {
      const res = await signup(values);

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
        placeholder="johndoe"
        label="Username"
        type="text"
        id="userName"
      />

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
        placeholder="Create a password"
        label="Password"
        type="password"
        id="password"
      />

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="Confirm your password"
        label="Confirm Password"
        type="password"
        id="passwordConfirm"
      />

      <AuthButton disabled={isPending} marginTop>
        Sign Up
      </AuthButton>
    </form>
  );
}

export default SignUpForm;
