"use client";

import { z } from "zod";
import FormRow from "../../_components/FormRow";
import { newPassword } from "@/app/_dataAcessLayer/authActions";
import toast from "react-hot-toast";
import { NewPasswordSchema } from "@/app/_schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import Input from "@/app/_components/Input";
import { useTransition } from "react";
import AuthButton from "../AuthButton";

function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isPending, startTransition] = useTransition();

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  function onSubmit(values: z.infer<typeof NewPasswordSchema>) {
    startTransition(async () => {
      if (!token) {
        toast.error("Missing token!");
        return;
      }

      const res = await newPassword(values);

      if ("success" in res) {
        toast.success(res.success);
        reset();
      }

      if ("error" in res) toast.error(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="••••••••"
        label="New password"
        type="password"
        id="password"
      />

      <FormRow
        errors={errors}
        register={register}
        disabled={isPending}
        placeholder="••••••••"
        label="Confirm new password"
        type="password"
        id="passwordConfirm"
      />

      <Input
        register={register}
        defaultValue={token || ""}
        disabled
        hidden
        type="text"
        id="token"
      />

      <div className="mt-10 mb-5 w-full border-b border-gray-300" />

      <AuthButton disabled={isPending}>Reset password</AuthButton>
    </form>
  );
}

export default NewPasswordForm;
