import React from "react";

const UserAvatar = ({
  user,
  className = "w-10 h-10",
  textSize = "text-lg",
}) => {
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.name}
        className={`${className} rounded-full object-cover border border-gray-200`}
      />
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Deterministic gradient based on name length? Or just random?
  // Let's stick to the requested "stylish gradient"
  const gradient = "bg-gradient-to-br from-blue-500 to-purple-600";

  return (
    <div
      className={`${className} rounded-full ${gradient} flex items-center justify-center text-white font-bold shadow-sm ${textSize}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
