import Image from "next/image";
import Link from "next/link";
import logo from "../../public/noBGLogo.png";

function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image
              src={logo}
              alt="PixelSync logo"
              priority
              className="absolute top-1/2 left-1/2 min-h-10 min-w-10 -translate-x-1/2 -translate-y-1/2"
              height={50}
              width={50}
            />
          </div>
          <span className="text-lg font-semibold text-white">PixelSync</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
