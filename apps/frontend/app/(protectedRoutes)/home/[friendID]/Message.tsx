import { useEffect, useState } from "react";
import UserAvatar from "@/app/_components/UserAvatar";
import LinkPreview, { URL_REGEX } from "./LinkPreview";

type MessageProps = {
  text: string;
  isOwn: boolean;
  senderName: string;
  createdAt: string;
  pending?: boolean;
  grouped?: boolean;
  senderId: string;
  avatarConfig?: string | null;
  isRead?: boolean;
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

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  const urls = text.match(URL_REGEX) || [];

  return parts.reduce<React.ReactNode[]>((acc, part, i) => {
    acc.push(part);
    if (urls[i]) {
      acc.push(
        <a
          key={i}
          href={urls[i]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {urls[i]}
        </a>,
      );
    }
    return acc;
  }, []);
}

function ReadReceipt({ isRead }: { isRead?: boolean }) {
  return (
    <span
      className={`ml-1.5 inline-flex shrink-0 align-middle text-[10px] leading-none ${isRead ? "text-white" : "text-white/40"}`}
    >
      {isRead ? "✓✓" : "✓"}
    </span>
  );
}

function Message({
  text,
  isOwn,
  senderName,
  createdAt,
  pending,
  grouped,
  senderId,
  avatarConfig,
  isRead,
}: MessageProps) {
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const date = new Date(createdAt);
    setFormattedDate(formatFullDate(date));
    setFormattedTime(formatTime(date));
  }, [createdAt]);

  const bubbleClasses = isOwn
    ? "bg-brand-500 text-white selection:bg-white/30"
    : "bg-surface border border-white/5 text-gray-200 selection:bg-brand-500/30";

  if (grouped) {
    return (
      <div
        className={`group flex w-full items-center gap-2 ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } ${pending ? "opacity-50" : "opacity-100"}`}
      >
        <div className="w-8 shrink-0" />

        <div className="max-w-[75%]">
          <div
            className={`inline-flex items-end gap-1 rounded-2xl px-3 py-1 wrap-break-word ${bubbleClasses}`}
          >
            <span className="text-[13.5px] leading-relaxed">
              {renderTextWithLinks(text)}
            </span>
            {isOwn && <ReadReceipt isRead={isRead} />}
          </div>
          <LinkPreview text={text} />
        </div>

        <span className="shrink-0 text-[10px] whitespace-nowrap text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
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
        avatarConfig={avatarConfig}
        size={32}
        className="mt-0.5 shrink-0"
      />

      <div
        className={`flex max-w-[75%] min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}
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

        <div>
          <div
            className={`mt-1 inline-flex items-end gap-1 rounded-2xl px-3 py-1.5 wrap-break-word ${bubbleClasses}`}
          >
            <span className="text-[13.5px] leading-relaxed">
              {renderTextWithLinks(text)}
            </span>
            {isOwn && <ReadReceipt isRead={isRead} />}
          </div>
          <LinkPreview text={text} />
        </div>
      </div>
    </div>
  );
}

export default Message;
