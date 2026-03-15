"use client";

import { useState, useTransition, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSession, signOut } from "next-auth/react";
import UserAvatar from "./UserAvatar";
import {
  updateUserName,
  updateDisplayName,
} from "../_dataAccessLayer/userActions";
import { useSocketContext } from "../_context/SocketContext";

type ProfileSettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenAvatarBuilder: () => void;
};

function ProfileSettingsPanel({
  isOpen,
  onClose,
  onOpenAvatarBuilder,
}: ProfileSettingsPanelProps) {
  const { data: session, update } = useSession();
  const { broadcastProfileUpdate } = useSocketContext();
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setUserName(session?.user?.userName || "");
      setDisplayName(session?.user?.name || "");
      setError("");
      setSuccess("");
    }
  }, [isOpen, session?.user?.userName, session?.user?.name]);

  const handleSave = () => {
    const trimmedUserName = userName.trim();
    const trimmedDisplayName = displayName.trim();
    const userNameChanged = trimmedUserName !== (session?.user?.userName || "");
    const displayNameChanged =
      trimmedDisplayName !== (session?.user?.name || "");

    if (!userNameChanged && !displayNameChanged) return;

    setError("");
    setSuccess("");

    startTransition(async () => {
      if (userNameChanged) {
        const result = await updateUserName({ userName: trimmedUserName });
        if (result && "error" in result) {
          setError(result.error as string);
          return;
        }
      }

      if (displayNameChanged) {
        const result = await updateDisplayName(trimmedDisplayName);
        if (result && "error" in result) {
          setError(result.error as string);
          return;
        }
      }

      await update();
      broadcastProfileUpdate({
        ...(userNameChanged ? { userName: trimmedUserName } : {}),
        ...(displayNameChanged ? { name: trimmedDisplayName } : {}),
      });
      setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 2000);
    });
  };

  if (!isOpen) return null;

  const hasChanges =
    userName.trim() !== (session?.user?.userName || "") ||
    displayName.trim() !== (session?.user?.name || "");

  return (
    <div className="fixed inset-0 z-90 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="border-border bg-secondary animate-in slide-in-from-right relative h-full w-80 border-l shadow-2xl duration-200">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-bold text-white">Profile Settings</h2>
            <button
              onClick={onClose}
              className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-white"
            >
              <Icon icon="mdi:close" className="text-lg" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <UserAvatar
                userName={session?.user?.userName ?? null}
                id={session?.user?.id}
                avatarConfig={session?.user?.avatarConfig}
                size={96}
              />
              <button
                onClick={() => {
                  onClose();
                  onOpenAvatarBuilder();
                }}
                className="text-brand-400 hover:text-brand-300 mt-3 text-sm font-medium transition-colors"
              >
                Change Avatar
              </button>
            </div>

            {/* Display Name */}
            <div className="mt-8">
              <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="border-border bg-surface focus:border-brand-500 w-full rounded-lg border px-3 py-2 text-sm text-white transition-colors outline-none placeholder:text-gray-500"
                placeholder="Display Name"
              />
            </div>

            {/* Username */}
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Username
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="border-border bg-surface focus:border-brand-500 w-full rounded-lg border px-3 py-2 text-sm text-white transition-colors outline-none placeholder:text-gray-500"
                placeholder="Username"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="bg-brand-500 hover:bg-brand-600 mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
            >
              {isPending && (
                <Icon icon="mdi:loading" className="animate-spin text-lg" />
              )}
              Save Changes
            </button>

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            {success && (
              <p className="mt-2 text-xs text-green-400">{success}</p>
            )}

            {/* Email (read-only) */}
            <div className="mt-6">
              <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Email
              </label>
              <p className="border-border bg-surface/50 rounded-lg border px-3 py-2 text-sm text-gray-400">
                {session?.user?.email}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border border-t px-5 py-4">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Icon icon="mdi:logout" className="text-base" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettingsPanel;
