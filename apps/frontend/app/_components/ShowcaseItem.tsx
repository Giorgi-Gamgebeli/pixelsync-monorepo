"use client";

import { Icon } from "@iconify/react/dist/iconify.js";

type ShowcaseItemProps = {
  icon: string;
  title: string;
  description: string;
};

function ShowcaseItem({ icon, title, description }: ShowcaseItemProps) {
  return (
    <div className="text-center">
      <div className="bg-brand-500/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <Icon icon={icon} className="text-brand-400 text-3xl" />
      </div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

export default ShowcaseItem;
