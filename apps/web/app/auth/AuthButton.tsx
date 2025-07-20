import React from "react";

type AuthButtonProps = {
  children: React.ReactNode;
  disabled: boolean;
  marginTop?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function AuthButton({ children, marginTop, ...rest }: AuthButtonProps) {
  return (
    <button
      className={`bg-brand-400 hover:bg-brand-500 border-brand-600 disabled:bg-brand-600 mb-5 w-full cursor-pointer rounded-lg border py-3 text-2xl text-gray-700 transition-all duration-300 disabled:cursor-not-allowed ${marginTop && "mt-14"}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default AuthButton;
