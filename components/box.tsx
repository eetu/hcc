import classNames from "classnames";
import React, { useState } from "react";

import styles from "../styles/box.module.css";
import Icon from "./icon";
import Spinner from "./spinner";

type BoxProps = {
  className?: string;
  drawer?: React.ReactElement;
  loading?: boolean;
  error?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const Box: React.FC<BoxProps> = ({
  className,
  children,
  drawer,
  loading,
  error,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className={classNames(className, styles.wait)}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classNames(className, styles.error)}>
        <Icon>error</Icon>
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.box, className, {
        [styles.collapsed]: !collapsed,
      })}
      onClick={() => setCollapsed(!collapsed)}
    >
      <div className={styles.top}>{children}</div>
      <div className={styles.middle}>
        <div className={styles.drawer}>{drawer}</div>
      </div>
      <div className={styles.bottom}>
        <Icon>menu</Icon>
      </div>
    </div>
  );
};

export default Box;
