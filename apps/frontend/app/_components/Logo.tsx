import Image from "next/image";
import logo from "@/public/noBGLogo.png";
import Link from "next/link";

type LogoProps = {
  className?: string;
};

function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src={logo}
        alt="PixelSync logo"
        priority
        height={36}
        width={36}
        className="rounded-full"
      />
      <span className="text-lg font-semibold text-gray-900">PixelSync</span>
    </Link>
  );
}

export default Logo;
