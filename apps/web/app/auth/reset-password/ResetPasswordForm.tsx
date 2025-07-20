"use client";

import { z } from "zod";
import FormRow from "../../_components/FormRow";
import Input from "../../_components/Input";
import { resetPassword } from "@/app/_dataAcessLayer/authActions";
import toast from "react-hot-toast";
import { ResetPasswordSchema } from "@/app/_schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthButton from "../AuthButton";
import { useTransition } from "react";

function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    startTransition(async () => {
      const res = await resetPassword(values);

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
        placeholder="example@gmail.com"
        label="Email"
        type="email"
        id="email"
      />

      <div className="mt-10 mb-5 w-full border-b border-gray-300" />

      <AuthButton disabled={isPending}>Send reset email</AuthButton>
    </form>
  );
}

export default ResetPasswordForm;
