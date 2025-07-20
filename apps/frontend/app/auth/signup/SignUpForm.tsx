"use client";

import FormRow from "../../_components/FormRow";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "../../_schemas/authSchemas";
import { signup } from "../../_dataAcessLayer/authActions";
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
      <ProviderButton
        onClick={() => providerSignIn("github")}
        disabled={isPending}
        icon="line-md:github-loop"
      >
        Continue with Github
      </ProviderButton>
      <ProviderButton
        onClick={() => providerSignIn("google")}
        disabled={isPending}
        icon="flat-color-icons:google"
      >
        Continue with Google
      </ProviderButton>

      <div className="mt-8 flex items-center gap-3">
        <div className="w-full border-b border-gray-300" />
        <span className="text-xl">or</span>
        <div className="w-full border-b border-gray-300" />
      </div>

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="john123"
        label="Username"
        type="text"
        id="userName"
      />

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="example@gmail.com"
        label="Email"
        type="email"
        id="email"
      />

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="••••••••"
        label="Password"
        type="password"
        id="password"
      />

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="••••••••"
        label="Reapeat password"
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
