import React from "react";

type RaindropIconProps = {
  size?: number;
};

const RaindropIcon: React.FC<RaindropIconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 65 65"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="5"
  >
    <path d="M32 4 C24 16, 8 28, 8 44 C8 54, 18 62, 32 62 C46 62, 56 54, 56 44 C56 28, 40 16, 32 4 Z" />
  </svg>
);

export default RaindropIcon;
