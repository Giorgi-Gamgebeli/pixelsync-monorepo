import Link from "next/link";

function UserAgreement() {
  return (
    <p className="mt-14 text-center text-lg">
      By continuing, you agree to Pixel Sync&apos;s{" "}
      <Link href="/service" className="text-cyan-500 hover:underline">
        Terms of Service{" "}
      </Link>
      and{" "}
      <Link href="/privacy" className="text-cyan-500 hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export default UserAgreement;
