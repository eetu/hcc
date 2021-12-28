import classNames from "classnames";
import React from "react";

type IconProps = {
  children: string;
  size?: "normal" | "big" | "bigger";
} & React.HTMLAttributes<HTMLDivElement>;

const Icon: React.FC<IconProps> = ({ children, style, size = "normal" }) => {
  return (
    <span
      style={style}
      className={classNames(
        "material-icons-outlined",
        size === "normal" && "md-24",
        size === "big" && "md-36",
        size === "bigger" && "md-48"
      )}
    >
      {children}
    </span>
  );
};

export default Icon;
