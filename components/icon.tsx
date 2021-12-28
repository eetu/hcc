import classNames from "classnames";
import React from "react";

type IconProps = {
  children: string;
  size?: "normal" | "big" | "bigger";
  type?: "normal" | "outlined";
} & React.HTMLAttributes<HTMLDivElement>;

const Icon: React.FC<IconProps> = ({
  children,
  style,
  className,
  size = "normal",
  type = "outlined",
}) => {
  return (
    <span
      style={style}
      className={classNames(
        className,
        `material-icons${type === "outlined" ? "-outlined" : ""}`,
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
