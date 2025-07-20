import Image from "next/image";
import Link from "next/link";

type ServerProps = {
  href: string;
  logo: string;
};

function Project({ href, logo }: ServerProps) {
  return (
    <Link
      href={href}
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-200"
    >
      <Image
        src={logo}
        alt="logo of the company"
        priority
        height={40}
        width={40}
      />
    </Link>
  );
}

export default Project;
