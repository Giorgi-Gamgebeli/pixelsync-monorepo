import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
};

function Button({ href, children }: ButtonProps) {
  return <Link href={href}>{children}</Link>;
}

export default Button;
