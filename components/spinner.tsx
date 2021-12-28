import React from "react";

import styles from "../styles/spinner.module.css";
import Icon from "./icon";

const Spinner: React.FC = () => {
  return (
    <div className={styles.spinner}>
      <Icon className={styles.sun}>wb_sunny</Icon>
      <Icon className={styles.cloud} type="normal">
        cloud
      </Icon>
    </div>
  );
};

export default Spinner;
