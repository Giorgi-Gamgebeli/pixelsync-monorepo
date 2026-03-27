"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { createRoom } from "@/app/_dataAccessLayer/actions";
import toast from "react-hot-toast";

type CreateRoomModalProps = {
  projectId: string;
  onClose: () => void;
};

function CreateRoomModal({ projectId, onClose }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState<
    "NORMAL" | "WEB_DESIGN" | "WEB_DESIGN_HTML_CSS"
  >("NORMAL");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!roomName.trim()) return;

    setIsLoading(true);
    try {
      const result = await createRoom(
        Number(projectId),
        roomName.trim(),
        boardType,
      );

      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Room created!");
        onClose();
      }
    } catch {
      toast.error("Failed to create room");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="border-border bg-secondary w-full max-w-md rounded-xl border p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create a Room</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-surface flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:text-gray-300"
          >
            <Icon icon="mdi:close" className="text-lg" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="roomName"
              className="mb-1.5 block text-sm font-medium text-gray-300"
            >
              Room name
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Wireframes"
              className="border-border bg-surface focus:border-brand-500 w-full rounded-lg border px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-gray-500"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="roomDescription"
              className="mb-1.5 block text-sm font-medium text-gray-300"
            >
              Description{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="roomDescription"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room for?"
              className="border-border bg-surface focus:border-brand-500 w-full rounded-lg border px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Board Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBoardType("NORMAL")}
                className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${
                  boardType === "NORMAL"
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-border bg-surface text-gray-400 hover:border-gray-500"
                }`}
              >
                <Icon icon="mdi:draw" className="text-2xl" />
                <span className="text-sm font-medium">Drawing Board</span>
              </button>

              <button
                type="button"
                onClick={() => setBoardType("WEB_DESIGN")}
                className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${
                  boardType === "WEB_DESIGN"
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-border bg-surface text-gray-400 hover:border-gray-500"
                }`}
              >
                <Icon icon="mdi:web" className="text-2xl" />
                <span className="text-sm font-medium">Web Design Board</span>
              </button>

              <button
                type="button"
                onClick={() => setBoardType("WEB_DESIGN_HTML_CSS")}
                className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${
                  boardType === "WEB_DESIGN_HTML_CSS"
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-border bg-surface text-gray-400 hover:border-gray-500"
                }`}
              >
                <Icon icon="mdi:language-html5" className="text-2xl" />
                <span className="text-sm font-medium">
                  Web Design (HTML CSS)
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="hover:bg-surface cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!roomName.trim() || isLoading}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/30 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
