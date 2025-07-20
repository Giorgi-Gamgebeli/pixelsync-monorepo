interface ReceiverSelectorProps {
  users: any[];
  receiverId: number;
  onChange: (id: number) => void;
}

export default function ReceiverSelector({
  users,
  receiverId,
  onChange,
}: ReceiverSelectorProps) {
  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-medium">Chat with:</label>
      <select
        value={receiverId}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full max-w-xs rounded border border-gray-300 px-3 py-2"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.firstName} {u.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}
