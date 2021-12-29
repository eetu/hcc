import classNames from "classnames";
import React from "react";

import styles from "../styles/arrow.module.css";

type ArrowProps = {
  className?: string;
  type?: "up" | "down" | "left" | "right";
} & React.HTMLAttributes<HTMLDivElement>;

const Arrow: React.FC<ArrowProps> = ({ className, style, type }) => {
  return (
    <span
      className={classNames(styles.arrow, className, {
        [styles.up]: type === "up",
        [styles.down]: type === "down",
        [styles.left]: type === "left",
        [styles.right]: type === "right",
      })}
      style={style}
    >
      <div className={styles.circle} />
      <div className={styles.pointer} />
    </span>
  );
};

export default Arrow;
