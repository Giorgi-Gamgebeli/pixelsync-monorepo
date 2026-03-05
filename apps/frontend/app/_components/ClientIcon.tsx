"use client";

import { Icon } from "@iconify/react/dist/iconify.js";

type ClientIconProps = {
  icon: string;
  className?: string;
};

function ClientIcon({ icon, className }: ClientIconProps) {
  return <Icon icon={icon} className={className} />;
}

export default ClientIcon;
