"use client";

import { HTMLInputTypeAttribute } from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import Link from "next/link";
import Input from "./Input";

type FormRowProps<T extends FieldValues> = {
  label: string;
  errors: FieldErrors<T>;
  type: HTMLInputTypeAttribute;
  placeholder: string;
  id: Path<T>;
  register: UseFormRegister<T>;
  forgotPassword?: boolean;
  disabled: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

function FormRow<T extends FieldValues>({
  label,
  errors,
  register,
  id,
  forgotPassword,
  ...rest
}: FormRowProps<T>) {
  return (
    <div className="relative flex flex-col gap-0.5 pt-[1.5rem] lg:pt-[1.2rem]">
      {label && (
        <label className="text-xl text-gray-700" htmlFor={id}>
          {label}
        </label>
      )}

      {forgotPassword && (
        <Link
          href="/auth/reset-password"
          className="absolute top-[0.6rem] right-0 mt-2 inline-block text-xl hover:underline"
        >
          Forgot Password?
        </Link>
      )}

      <Input id={id} register={register} {...rest} />

      {errors[id] && (
        <span className="text-xl text-red-700">
          {String(errors[id].message)}
        </span>
      )}
    </div>
  );
}

export default FormRow;
