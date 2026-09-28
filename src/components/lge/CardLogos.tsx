import React from "react";

export const CardLogo: React.FC<{ name: string; className?: string }> = ({
  name,
  className = "w-6 h-6",
}) => {
  switch (name) {
    case "신한":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <circle cx="20" cy="20" r="18" fill="#0046FF" />
          <path
            d="M20 9C14 9 10 13 10 18C10 23 15 25 20 27C25 29 26 31 26 32C26 34 23 35 20 35C15 35 12 32 12 32L10 35C10 35 14 38 20 38C26 38 30 35 30 31C30 25 25 23 20 21C15 19 14 17 14 16C14 14 17 12 20 12C24 12 27 15 27 15L29 12C29 12 26 9 20 9Z"
            fill="white"
          />
        </svg>
      );
    case "현대":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <rect x="3" y="6" width="34" height="28" rx="6" fill="#111111" />
          <path
            d="M12 14H16V18H24V14H28V26H24V22H16V26H12V14Z"
            fill="white"
          />
        </svg>
      );
    case "KB국민":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <circle cx="20" cy="20" r="18" fill="#695F54" />
          <path
            d="M20 11L22.5 16.5L28.5 17.3L24 21.5L25.3 27.5L20 24.5L14.7 27.5L16 21.5L11.5 17.3L17.5 16.5L20 11Z"
            fill="#FFBC00"
          />
        </svg>
      );
    case "롯데":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <circle cx="20" cy="20" r="18" fill="#ED1C24" />
          <circle cx="20" cy="20" r="14" fill="#333333" />
          <text
            x="20"
            y="25"
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            LOTTE
          </text>
        </svg>
      );
    case "하나Pay":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <circle cx="20" cy="20" r="18" fill="#008485" />
          <path
            d="M20 12C16 12 13 15 13 19C13 24 18 28 20 29C22 28 27 24 27 19C27 15 24 12 20 12Z"
            fill="#E02B20"
          />
          <circle cx="20" cy="18" r="3" fill="white" />
        </svg>
      );
    case "NH농협":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <circle cx="20" cy="20" r="18" fill="#005BAA" />
          <circle cx="20" cy="20" r="11" fill="#FFCC00" />
          <path
            d="M16 16H24V24H16V16Z"
            fill="#005BAA"
          />
        </svg>
      );
    case "우리":
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none">
          <circle cx="20" cy="20" r="18" fill="#0072CE" />
          <circle cx="20" cy="15" r="5" fill="#52B6FF" />
          <path
            d="M12 27C15 22 25 22 28 27H12Z"
            fill="white"
          />
        </svg>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
          +
        </div>
      );
  }
};
