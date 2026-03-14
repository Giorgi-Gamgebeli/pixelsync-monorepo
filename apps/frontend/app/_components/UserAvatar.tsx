import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

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
  avatarConfig?: string | null;
};

function UserAvatar({
  userName,
  id,
  size = 40,
  className = "",
  showStatus = false,
  status,
  statusBorderColor = "border-primary",
  avatarConfig,
}: UserAvatarProps) {
  const seed = id || userName || "?";

  const customSvg = useMemo(() => {
    if (!avatarConfig) return null;
    try {
      const options = JSON.parse(avatarConfig);
      return createAvatar(adventurer, {
        seed,
        scale: 100,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
        ...options,
      }).toString();
    } catch (e) {
      console.error("Failed to parse avatarConfig", e);
      return null;
    }
  }, [avatarConfig, seed]);

  const colorIndex = djb2Hash(seed) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];
  const initial = userName?.charAt(0).toUpperCase() || "?";
  const fontSize = Math.round(size * 0.4);
  const dotSize = Math.max(10, Math.round(size * 0.3));

  return (
    <div
      className={`relative shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: customSvg ? "transparent" : bgColor,
      }}
    >
      {customSvg ? (
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-full font-semibold"
          dangerouslySetInnerHTML={{ __html: customSvg }}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-semibold text-white"
          style={{ fontSize }}
        >
          {initial}
        </span>
      )}

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
