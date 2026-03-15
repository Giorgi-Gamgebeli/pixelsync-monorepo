import { useEffect, useState } from "react";

type MessageProps = {
  text: string;
  isOwn: boolean;
  senderName: string;
  createdAt: string;
  pending?: boolean;
};

const formatDiscordDate = (date: Date) => {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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

function Message({ text, isOwn, senderName, createdAt, pending }: MessageProps) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(formatDiscordDate(new Date(createdAt)));
  }, [createdAt]);

  return (
    <div
      className={`group flex w-full flex-col py-1 transition-all duration-200 ${
        isOwn ? "items-end" : "items-start"
      } ${pending ? "opacity-50" : "opacity-100"}`}
    >
      <div
        className={`flex items-center gap-2 px-2 text-xs ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <span className="font-bold text-white transition-opacity">
          {senderName}
        </span>
        <span className="text-[10px] whitespace-nowrap text-gray-500 transition-opacity">
          {formattedDate}
        </span>
      </div>

      <div
        className={`relative mt-0.5 max-w-[85%] rounded-2xl px-4 py-2 wrap-break-word shadow-sm transition-all duration-200 ${
          isOwn
            ? "bg-brand-500 rounded-tr-none text-white selection:bg-white/30"
            : "bg-surface selection:bg-brand-500/30 rounded-tl-none border border-white/5 text-gray-200"
        }`}
      >
        <p className="text-[13.5px] leading-relaxed">{text}</p>

        {/* Subtle glow for own messages */}
        {isOwn && (
          <div className="bg-brand-400 absolute inset-0 -z-10 rounded-2xl opacity-20 blur-md" />
        )}
      </div>
    </div>
  );
}

export default Message;
