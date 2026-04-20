import { useTheme } from "@emotion/react";
import React from "react";

type ArrowProps = {
  className?: string;
  deg?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const Arrow: React.FC<ArrowProps> = ({ className, deg }) => {
  const theme = useTheme();

  return (
    <div
      className={className}
      style={{ transform: `rotate(${deg}deg)` }}
      css={{
        position: "relative",
        height: "24px",
        width: "24px",
      }}
    >
      <div
        css={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "inherit",
          width: "inherit",
          borderRadius: "100%",
          border: `1px solid ${theme.colors.text.main}`,
          opacity: 0.5,
        }}
      />
      <svg
        viewBox="0 0 24 24"
        css={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <path d="M12 5 L17 14 L12 11 L7 14 Z" fill={theme.colors.text.main} />
      </svg>
    </div>
  );
};

export default Arrow;
