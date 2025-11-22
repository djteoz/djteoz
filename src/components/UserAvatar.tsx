import React, { useState, useEffect } from "react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name = "?",
  size = 40,
  className = "",
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

  // Generate a consistent color based on name if needed,
  // but for now we stick to the site style (Indigo/Purple gradient)
  // as requested "unique to our site style".

  if (imgSrc && !error) {
    return (
      <img
        src={imgSrc}
        alt={name}
        className={`rounded-full object-cover bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-sm select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
      title={name}
    >
      {initials}
    </div>
  );
};
