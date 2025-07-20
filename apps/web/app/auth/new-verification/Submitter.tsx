"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { newVerification } from "@/app/_dataAcessLayer/authActions";

// just becouse useSearchParams hook needs to be wrapped in suspense
function Submitter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  async function onSubmit() {
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

  useEffect(() => {
    onSubmit();
  }, []);

  return null;
}

export default Submitter;
