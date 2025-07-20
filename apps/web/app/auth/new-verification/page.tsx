import { BounceLoader } from "react-spinners";
import Logo from "@/app/_components/Logo";
import Submitter from "./Submitter";
import { Suspense } from "react";

function Page() {
  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <Logo className="absolute top-0 left-0 px-10 py-6" />

      <Suspense>
        <Submitter />
      </Suspense>

      <div className="flex flex-col items-center gap-20 rounded-2xl p-5">
        <BounceLoader color="oklch(0.715 0.143 215.221)" size={80} />
      </div>
    </main>
  );
}

export default Page;
