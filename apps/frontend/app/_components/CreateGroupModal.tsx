"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getFriends } from "@/app/_dataAccessLayer/userActions";
import { createGroupChat } from "@/app/_dataAccessLayer/groupActions";
import { useSocketContext } from "@/app/_context/SocketContext";
import UserAvatar from "./UserAvatar";

type Friend = {
  id: string;
  userName: string | null;
  avatarConfig?: string | null;
};

type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const router = useRouter();
  const { joinGroup } = useSocketContext();
  const [name, setName] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      getFriends().then((result) => {
        if (Array.isArray(result)) {
          setFriends(result);
        }
      });
      setName("");
      setSelected(new Set());
      setError("");
    }
  }, [isOpen]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one member");
      return;
    }

    startTransition(async () => {
      const result = await createGroupChat({
        name: name.trim(),
        memberIds: [...selected],
      });

      if (result && "error" in result) {
        setError(result.error as string);
        return;
      }

      if (result && "id" in result) {
        joinGroup(result.id);
        onClose();
        router.push(`/home/group/${result.id}`);
        router.refresh();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="border-border bg-secondary w-full max-w-md rounded-2xl border p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">Create Group</h3>

        <div className="mt-4">
          <input
            type="text"
            placeholder="Group name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="border-border bg-surface focus:border-brand-500 w-full rounded-lg border px-4 py-2 text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>

        <p className="mt-4 text-xs font-medium text-gray-500">Add Members</p>
        <div className="scrollbar-thin mt-2 max-h-48 overflow-y-auto">
          {friends.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-500">
              No friends to add
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => toggle(friend.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selected.has(friend.id)
                      ? "bg-brand-500/10 text-brand-400"
                      : "hover:bg-surface text-gray-300"
                  }`}
                >
                  <UserAvatar
                    userName={friend.userName}
                    id={friend.id}
                    avatarConfig={friend.avatarConfig}
                    size={28}
                  />
                  <span className="flex-1 truncate text-left">
                    {friend.userName}
                  </span>
                  {selected.has(friend.id) && (
                    <Icon
                      icon="mdi:check-circle"
                      className="text-brand-400 text-lg"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="hover:bg-surface rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending || !name.trim() || selected.size === 0}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
          >
            {isPending && (
              <Icon icon="mdi:loading" className="animate-spin text-lg" />
            )}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
