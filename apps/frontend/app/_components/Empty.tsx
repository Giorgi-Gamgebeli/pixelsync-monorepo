"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

type EmptyProps = {
  text: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

function Empty({
  text,
  description,
  icon = "mdi:inbox",
  actionLabel,
  actionHref,
  onAction,
}: EmptyProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <Icon icon={icon} className="text-3xl text-gray-500" />
      </div>
      <p className="text-sm font-medium text-white">{text}</p>
      {description && (
        <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-brand-500 hover:bg-brand-600 mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="bg-brand-500 hover:bg-brand-600 mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default Empty;
