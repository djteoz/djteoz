import React, { useState, useEffect } from "react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name = "?",
  size,
  className = "",
  style = {},
}) => {
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (avatar) {
      const src =
        avatar.startsWith("data:") || avatar.startsWith("http")
          ? avatar
          : `/uploads/${avatar}`;
      setImgSrc(src);
      setError(false);
    } else {
      setImgSrc(null);
    }
  }, [avatar]);

  const initials =
    (name || "?")
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // Generate a consistent color based on name
  const getGradient = (name: string) => {
    const gradients = [
      "bg-gradient-to-br from-indigo-500 to-purple-600",
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "bg-gradient-to-br from-blue-500 to-indigo-500",
      "bg-gradient-to-br from-violet-500 to-fuchsia-500",
      "bg-gradient-to-br from-indigo-400 to-cyan-500",
      "bg-gradient-to-br from-fuchsia-600 to-pink-600",
      "bg-gradient-to-br from-slate-600 to-slate-800",
      "bg-gradient-to-br from-indigo-600 to-blue-600",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return gradients[Math.abs(hash) % gradients.length];
  };

  const sizeStyle = size ? { width: size, height: size } : {};
  const fontSize = size ? Math.max(10, size * 0.4) : undefined;

  if (imgSrc && !error) {
    return (
      <img
        src={imgSrc}
        alt={name}
        className={`rounded-full object-cover bg-gray-100 ${className}`}
        style={{ ...sizeStyle, ...style }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shadow-sm select-none ${getGradient(
        name
      )} ${className}`}
      style={{ ...sizeStyle, fontSize, ...style }}
      title={name}
    >
      {initials}
    </div>
  );
};
