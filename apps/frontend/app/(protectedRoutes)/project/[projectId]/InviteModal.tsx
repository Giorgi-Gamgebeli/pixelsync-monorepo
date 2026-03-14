"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { generateInviteLink } from "@/app/_dataAccessLayer/actions";
import toast from "react-hot-toast";

type InviteModalProps = {
  projectId: string;
  projectName: string;
  onClose: () => void;
};

function InviteModal({ projectId, projectName, onClose }: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCopyLink() {
    setIsLoading(true);
    try {
      const result = await generateInviteLink(Number(projectId));

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      if (result && "success" in result) {
        await navigator.clipboard.writeText(result.success);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error("Failed to generate invite link");
    } finally {
      setIsLoading(false);
    }
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
            aria-label="Close"
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
          disabled={isLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon
            icon={copied ? "mdi:check" : "mdi:link-variant"}
            className="text-lg"
          />
          {isLoading
            ? "Generating..."
            : copied
              ? "Link Copied!"
              : "Copy Invite Link"}
        </button>
      </div>
    </div>
  );
}

export default InviteModal;
