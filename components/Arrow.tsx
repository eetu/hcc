import classNames from "classnames";
import React from "react";

import styles from "../styles/arrow.module.css";

type ArrowProps = {
  className?: string;
  deg?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const Arrow: React.FC<ArrowProps> = ({ className, style, deg }) => {
  return (
    <div
      className={classNames(className, styles.arrow)}
      style={{ transform: `rotate(${deg}deg)` }}
    >
      <div className={styles.circle} />
      <div className={styles.pointer} />
    </div>
  );
};

export default Arrow;
