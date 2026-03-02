import React from "react";

type AuthButtonProps = {
  children: React.ReactNode;
  disabled: boolean;
  marginTop?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function AuthButton({ children, marginTop, ...rest }: AuthButtonProps) {
  return (
    <button
      className={`bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 w-full cursor-pointer rounded-lg py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed ${marginTop ? "mt-8" : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default AuthButton;
