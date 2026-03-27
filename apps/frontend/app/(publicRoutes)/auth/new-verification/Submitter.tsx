"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { newVerification } from "@/app/_dataAccessLayer/authActions";

// useSearchParams hook needs to be wrapped in Suspense
function Submitter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    async function verify() {
      if (!token)
        return router.replace(
          `/auth/signin?verificationError=${"Missing token!"}`,
        );

      const res = await newVerification(token);

      if ("success" in res)
        router.replace(`/auth/signin?verificationSuccess=${res.success}`);
      if ("error" in res)
        router.replace(`/auth/signin?verificationError=${res.error}`);
    }
    verify();
  }, [token, router]);

  return null;
}

export default Submitter;
