import Logo from "@/app/_components/Logo";
import Link from "next/link";
import { Suspense } from "react";
import AuthRightSide from "../AuthRightSide";
import SignInForm from "./SignInForm";

function Page() {
  return (
    <main className="grid h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-8 py-6 lg:px-12">
        <Logo className="mb-8" />

        <div className="flex flex-1 flex-col justify-center px-4 lg:px-14">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mb-10 text-base text-gray-500">
            Sign in to your account to continue
          </p>

          <Suspense>
            <SignInForm />
          </Suspense>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-brand-500 hover:text-brand-600 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <AuthRightSide />
    </main>
  );
}

export default Page;
