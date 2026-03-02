"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";

type InviteModalProps = {
  projectName: string;
  onClose: () => void;
};

function InviteModal({ projectName, onClose }: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    // TODO: generate and copy actual invite link
    navigator.clipboard.writeText(`https://pixelsync.app/invite/abc123`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-border bg-secondary p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Invite to {projectName}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-surface hover:text-gray-300"
          >
            <Icon icon="mdi:close" className="text-lg" />
          </button>
        </div>

        {/* Search friends */}
        <div className="relative mb-4">
          <Icon
            icon="mdi:magnify"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-lg text-gray-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by username"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3.5 pl-9 text-sm text-white outline-none placeholder:text-gray-500 focus:border-brand-500"
            autoFocus
          />
        </div>

        {/* Friends list */}
        <div className="scrollbar-thin mb-4 max-h-48 overflow-y-auto">
          <p className="py-6 text-center text-sm text-gray-500">
            Search for friends to invite them to this project.
          </p>
        </div>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-b border-border" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 border-b border-border" />
        </div>

        {/* Copy invite link */}
        <button
          onClick={handleCopyLink}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface"
        >
          <Icon
            icon={copied ? "mdi:check" : "mdi:link-variant"}
            className="text-lg"
          />
          {copied ? "Link Copied!" : "Copy Invite Link"}
        </button>
      </div>
    </div>
  );
}

export default InviteModal;
