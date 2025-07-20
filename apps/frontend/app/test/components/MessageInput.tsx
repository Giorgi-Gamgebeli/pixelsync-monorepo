import { useState } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: (value: string) => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onTyping(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(inputValue);
    setInputValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        className="flex-1 rounded border border-gray-300 px-3 py-2"
        placeholder="Type a message..."
      />
      <button
        type="submit"
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Send
      </button>
    </form>
  );
}
