"use client";

import { Icon } from "@iconify/react/dist/iconify.js";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: string;
};

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 transition-shadow hover:shadow-lg hover:shadow-brand-500/5">
      <div className="bg-brand-500/10 text-brand-400 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
        <Icon icon={icon} className="text-2xl" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

export default FeatureCard;
