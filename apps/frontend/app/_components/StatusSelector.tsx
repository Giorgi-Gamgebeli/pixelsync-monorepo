"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "../_context/SocketContext";
import { updateStatus } from "../_dataAccessLayer/userActions";
import { UserStatus } from "@repo/types";

const STATUS_CONFIG: Record<
  UserStatus,
  { label: string; color: string; bgColor: string }
> = {
  ONLINE: { label: "Online", color: "text-green-500", bgColor: "bg-green-500" },
  IDLE: { label: "Idle", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  DO_NOT_DISTURB: {
    label: "Do Not Disturb",
    color: "text-red-500",
    bgColor: "bg-red-500",
  },
  OFFLINE: { label: "Offline", color: "text-gray-500", bgColor: "bg-gray-500" },
};

const STATUSES: UserStatus[] = ["ONLINE", "IDLE", "DO_NOT_DISTURB", "OFFLINE"];

type StatusSelectorProps = {
  currentStatus: UserStatus;
  userId: string;
  size?: "sm" | "md";
};

function StatusSelector({
  currentStatus,
  userId,
  size = "md",
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setStatus } = useSocketContext();

  const currentConfig = STATUS_CONFIG[currentStatus];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: UserStatus) => {
    setIsPending(true);
    try {
      await updateStatus({ userId, status: newStatus });
      setStatus(newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsPending(false);
    }
  };

  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const padding = size === "sm" ? "px-2 py-1" : "px-3 py-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`border-border bg-surface hover:bg-surface/80 flex items-center gap-2 rounded-full border transition-colors ${padding}`}
      >
        <div className={`${dotSize} rounded-full ${currentConfig.bgColor}`} />
        <span className={`${textSize} font-medium text-gray-300`}>
          {currentConfig.label}
        </span>
        <Icon
          icon="mdi:chevron-down"
          className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-border bg-secondary absolute top-full left-0 z-50 mt-2 w-48 rounded-xl border py-1.5 shadow-xl">
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = status === currentStatus;
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isPending}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-surface text-white"
                    : "hover:bg-surface/50 text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className={`${dotSize} rounded-full ${config.bgColor}`} />
                <span className={`${textSize} font-medium`}>
                  {config.label}
                </span>
                {isActive && (
                  <Icon icon="mdi:check" className="text-brand-400 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StatusSelector;
