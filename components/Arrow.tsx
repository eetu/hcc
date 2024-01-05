import React from "react";

type ArrowProps = {
  className?: string;
  deg?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const Arrow: React.FC<ArrowProps> = ({ className, deg }) => {
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
          border: "1px solid var(--color)",
          opacity: 0.5,
        }}
      />
      <div
        css={{
          position: "absolute",
          left: 7,
          top: 6,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: "10px solid var(--color)",
        }}
      />
    </div>
  );
};

export default Arrow;
