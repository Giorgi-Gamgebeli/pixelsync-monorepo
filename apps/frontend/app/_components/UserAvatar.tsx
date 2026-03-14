"use client";

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

const AVATAR_COLORS = [
  "#E53E3E",
  "#DD6B20",
  "#D69E2E",
  "#38A169",
  "#319795",
  "#3182CE",
  "#5A67D8",
  "#805AD5",
  "#D53F8C",
  "#2B6CB0",
  "#9F7AEA",
  "#ED8936",
];

type UserAvatarProps = {
  userName: string | null;
  id?: string;
  size?: number;
  className?: string;
  showStatus?: boolean;
  status?: string;
  statusBorderColor?: string;
};

function UserAvatar({
  userName,
  id,
  size = 40,
  className = "",
  showStatus = false,
  status,
  statusBorderColor = "border-primary",
}: UserAvatarProps) {
  const seed = id || userName || "?";
  const colorIndex = djb2Hash(seed) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];
  const initial = userName?.charAt(0).toUpperCase() || "?";
  const fontSize = Math.round(size * 0.4);
  const dotSize = Math.max(10, Math.round(size * 0.3));

  return (
    <div
      className={`relative shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold text-white"
        style={{ fontSize }}
      >
        {initial}
      </span>
      {showStatus && status === "ONLINE" && (
        <div
          className={`absolute -right-0.5 -bottom-0.5 rounded-full border-2 bg-green-500 ${statusBorderColor}`}
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  );
}

export default UserAvatar;
