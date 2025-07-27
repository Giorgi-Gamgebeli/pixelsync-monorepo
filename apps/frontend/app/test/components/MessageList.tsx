import { DirectMessage } from "@repo/types";

interface MessageListProps {
  messages: DirectMessage[];
  currentUser: any;
  receiverId: number;
  isTyping: boolean;
  users: any[];
}

export default function MessageList({
  messages,
  currentUser,
  receiverId,
  isTyping,
  users,
}: MessageListProps) {
  const filteredMessages = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.receiverId === receiverId) ||
      (m.receiverId === currentUser.id && m.senderId === receiverId),
  );

  return (
    <div className="mb-4 h-[400px] overflow-y-auto rounded border border-gray-200 p-4">
      {filteredMessages.map((msg, i) => (
        <div
          key={i}
          className={`mb-2 flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`rounded-lg px-4 py-2 ${
              msg.senderId === currentUser.id
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isTyping && (
        <div className="text-sm text-gray-500 italic">
          {users.find((u) => u.id === receiverId)?.firstName} is typing...
        </div>
      )}
    </div>
  );
}
