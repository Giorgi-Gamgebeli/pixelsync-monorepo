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
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-1 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-gray-100"
      />

      {type === "password" && (
        <>
          <Icon
            icon="qlementine-icons:eye-crossed-16"
            className={`absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-lg text-gray-400 ${showPassword ? "z-10" : "-z-10"}`}
            onClick={() => setShowPassword(!showPassword)}
          />

          <Icon
            icon="qlementine-icons:eye-16"
            className={`absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-lg text-gray-400 ${showPassword ? "-z-10" : "z-10"}`}
            onClick={() => setShowPassword(!showPassword)}
          />
        </>
      )}
    </div>
  );
}

export default Input;
