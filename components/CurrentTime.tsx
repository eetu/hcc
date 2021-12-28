import classNames from "classnames";
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";
import React from "react";

import styles from "../styles/current-time.module.css";
import useCurrentTime from "./useCurrentTime";

type CurrentTimeProps = {} & React.HTMLAttributes<HTMLDivElement>;

const CurrentTime: React.FC<CurrentTimeProps> = ({ className }) => {
  const currentTime = useCurrentTime();

  return (
    <div className={classNames(className, styles.currentTime)}>
      <div className={classNames(styles.time)}>
        <span>{format(currentTime, "HH")}</span>
        <span>:</span>
        <span>{format(currentTime, "mm")}</span>
      </div>
      <div className={styles.date}>
        {format(currentTime, "EEEE dd. MMMM yyyy", { locale: fiLocale })}
      </div>
    </div>
  );
};
export default CurrentTime;
