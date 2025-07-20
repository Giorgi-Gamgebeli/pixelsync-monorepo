import ScrollFloatingAnimation from "./ScrollFloatingEffect";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/noBGLogo.png";

function Header() {
  return (
    <ScrollFloatingAnimation>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <div className="relative h-11 w-11 overflow-hidden rounded-full">
            <Image
              src={logo}
              alt="logo of the company"
              priority
              className="absolute top-1/2 left-1/2 min-h-12 min-w-12 -translate-x-1/2 -translate-y-1/2"
              height={70}
              width={70}
            />
          </div>
          <p className="text-lg">Pixel Sync</p>
        </div>
        {/* <Nav /> */}
        <div className="border-brand-200 flex items-center gap-2 border-l pl-2">
          <Link
            href="/auth/signin"
            className="border-brand-200 hover:bg-brand-200 rounded-full border px-3 py-2 transition-all duration-300"
          >
            Signin
          </Link>
          <Link
            href="/auth/signup"
            className="bg-primary hover:bg-secondary rounded-full px-4 py-2 text-sm text-white transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </div>
    </ScrollFloatingAnimation>
  );
}

export default Header;
