import React from "react";
import styles from "../styles/spinner.module.css";

const Spinner: React.FC = () => {
  return (
    <div className={styles["lds-ellipsis"]}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Spinner;
