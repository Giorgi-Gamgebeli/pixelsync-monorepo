import Link from "next/link";
import Logo from "@/app/_components/Logo";
import ResetPasswordForm from "./ResetPasswordForm";

function page() {
  return (
    <main className="flex h-screen min-h-[40rem] items-center justify-center">
      <Logo className="absolute top-0 left-0 px-10 py-6" />

      <div className="min-w-[35rem]">
        <h1 className="text-[2.5rem]">Reset Your Password</h1>

        <h3 className="mb-12 text-lg text-gray-700">
          Type in your email and we'll send you a link to reset your password
        </h3>

        <ResetPasswordForm />

        <div className="mt-5 flex justify-center gap-2 text-xl">
          <p>Already have an account?</p>
          <Link href="/auth/signin" className="text-brand-500 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

export default page;
