"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { HTMLInputTypeAttribute, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

type InputProps<T extends FieldValues> = {
  type: HTMLInputTypeAttribute;
  id: Path<T>;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegister<T>;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Input<T extends FieldValues>({
  type,
  id,
  onBlur,
  register,
  ...rest
}: InputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : type}
        id={id}
        {...(register && id
          ? register(id, { valueAsNumber: type === "number" })
          : { onBlur: onBlur, name: id })}
        {...rest}
        className="border-border bg-surface focus:border-brand-500 focus:ring-brand-500/20 disabled:bg-surface/50 w-full rounded-lg border px-3.5 py-2.5 text-sm text-white transition-colors outline-none placeholder:text-gray-500 focus:ring-1 disabled:cursor-not-allowed"
      />

      {type === "password" && (
        <Icon
          icon={
            showPassword
              ? "qlementine-icons:eye-crossed-16"
              : "qlementine-icons:eye-16"
          }
          className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-lg text-gray-500 hover:text-gray-300"
          onClick={() => setShowPassword(!showPassword)}
        />
      )}
    </div>
  );
}

export default Input;
