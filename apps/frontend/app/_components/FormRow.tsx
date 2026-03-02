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
    <div className="flex flex-col gap-1.5 pt-4">
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-sm font-medium text-gray-700" htmlFor={id}>
            {label}
          </label>
        )}

        {forgotPassword && (
          <Link
            href="/auth/reset-password"
            className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          >
            Forgot password?
          </Link>
        )}
      </div>

      <Input id={id} register={register} {...rest} />

      {errors[id] && (
        <span className="text-sm text-red-500">
          {String(errors[id].message)}
        </span>
      )}
    </div>
  );
}

export default FormRow;
