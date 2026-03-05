type MessageProps = {
  text: string;
  isOwn?: boolean;
  senderName?: string;
};

function Message({ text, isOwn, senderName }: MessageProps) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <p className="mb-0.5 text-xs font-medium text-gray-500">{senderName}</p>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 ${
          isOwn ? "bg-brand-500 text-white" : "bg-surface text-gray-200"
        }`}
      >
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}

export default Message;
