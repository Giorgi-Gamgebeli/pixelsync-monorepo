import Image from "next/image";
import logo from "@/public/noBGLogo.png";
import Link from "next/link";

type LogoProps = {
  className?: string;
};

function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-1 ${className}`}>
      <Image
        src={logo}
        alt="logo of the company"
        priority
        height={50}
        width={50}
      />
      <h2 className="text-2xl font-semibold">Pixel Sync</h2>
    </Link>
  );
}

export default Logo;
