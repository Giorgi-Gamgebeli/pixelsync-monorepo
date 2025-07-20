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
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-xl outline-none focus:border-gray-400 focus:shadow-[0_0_10px_rgba(0,0,0,0.01)] focus:shadow-gray-200 focus:outline disabled:cursor-not-allowed disabled:bg-gray-200"
      />

      {type === "password" && (
        <>
          <Icon
            icon="qlementine-icons:eye-crossed-16"
            className={`absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-[1.7rem] ${showPassword ? "z-10" : "-z-10"}`}
            onClick={() => setShowPassword(!showPassword)}
          />

          <Icon
            icon="qlementine-icons:eye-16"
            className={`absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-[1.7rem] ${showPassword ? "-z-10" : "z-10"}`}
            onClick={() => setShowPassword(!showPassword)}
          />
        </>
      )}
    </div>
  );
}

export default Input;
