import { useEffect, useState } from "react";
import UserAvatar from "@/app/_components/UserAvatar";

type MessageProps = {
  text: string;
  isOwn: boolean;
  senderName: string;
  createdAt: string;
  pending?: boolean;
  grouped?: boolean;
  senderId: string;
  avatarConfig?: string | null;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatFullDate = (date: Date) => {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  const timeString = formatTime(date);

  if (diffInDays === 0 && now.getDate() === date.getDate()) {
    return `Today at ${timeString}`;
  } else if (
    diffInDays === 1 ||
    (diffInDays === 0 && now.getDate() !== date.getDate())
  ) {
    return `Yesterday at ${timeString}`;
  } else {
    return `${date.toLocaleDateString()} ${timeString}`;
  }
};

function Message({
  text,
  isOwn,
  senderName,
  createdAt,
  pending,
  grouped,
  senderId,
  avatarConfig,
}: MessageProps) {
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const date = new Date(createdAt);
    setFormattedDate(formatFullDate(date));
    setFormattedTime(formatTime(date));
  }, [createdAt]);

  if (grouped) {
    return (
      <div
        className={`group flex w-full items-center gap-2 ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } ${pending ? "opacity-50" : "opacity-100"}`}
      >
        {/* Spacer matching avatar width */}
        <div className="w-8 shrink-0" />

        <div
          className={`relative max-w-[75%] rounded-2xl px-4 py-1.5 wrap-break-word shadow-sm ${
            isOwn
              ? "bg-brand-500 text-white selection:bg-white/30"
              : "bg-surface border border-white/5 text-gray-200 selection:bg-brand-500/30"
          }`}
        >
          <p className="text-[13.5px] leading-relaxed">{text}</p>
        </div>

        <span className="text-[10px] whitespace-nowrap text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
          {formattedTime}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group flex w-full items-start gap-2 pt-3 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      } ${pending ? "opacity-50" : "opacity-100"}`}
    >
      <UserAvatar
        userName={senderName === "You" ? null : senderName}
        id={senderId}
        avatarConfig={isOwn ? undefined : avatarConfig}
        size={32}
        className="mt-0.5 shrink-0"
      />

      <div
        className={`flex min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        <div
          className={`flex items-center gap-2 px-1 text-xs ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="font-semibold text-white">{senderName}</span>
          <span className="text-[10px] whitespace-nowrap text-gray-500">
            {formattedDate}
          </span>
        </div>

        <div
          className={`relative mt-1 max-w-[75%] rounded-2xl px-4 py-2 wrap-break-word shadow-sm ${
            isOwn
              ? "bg-brand-500 rounded-tr-none text-white selection:bg-white/30"
              : "bg-surface rounded-tl-none border border-white/5 text-gray-200 selection:bg-brand-500/30"
          }`}
        >
          <p className="text-[13.5px] leading-relaxed">{text}</p>

          {isOwn && (
            <div className="bg-brand-400 absolute inset-0 -z-10 rounded-2xl opacity-20 blur-md" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Message;
