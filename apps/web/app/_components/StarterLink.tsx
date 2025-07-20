import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
};

function StarterLink({ href, children }: ButtonProps) {
  return <Link href={href}>{children}</Link>;
}

export default StarterLink;
