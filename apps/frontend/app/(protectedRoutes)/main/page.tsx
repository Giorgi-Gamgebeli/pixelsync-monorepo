"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

function Page() {
  const { data: session, update } = useSession();

  useEffect(() => {
    update();
  }, []);

  if (!session) return <p>no session</p>;

  return (
    <main className="h-screen w-screen">
      <div>{JSON.stringify(session?.user)}</div>
      <button
        onClick={async () => await signOut()}
        className="cursor-pointer border border-black"
      >
        signOut
      </button>
    </main>
  );
}

export default Page;
