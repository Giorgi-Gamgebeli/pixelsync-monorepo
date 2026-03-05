import Logo from "@/app/_components/Logo";
import Link from "next/link";
import AuthRightSide from "../AuthRightSide";
import SignUpForm from "./SignUpForm";

function Page() {
  return (
    <main className="grid h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-8 py-6 lg:px-12">
        <Logo className="mb-8" />

        <div className="flex flex-1 flex-col justify-center px-4 lg:px-14">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mb-10 text-base text-gray-500">
            Get started with PixelSync for free
          </p>

          <SignUpForm />

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-brand-500 hover:text-brand-600 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <AuthRightSide />
    </main>
  );
}

export default Page;
