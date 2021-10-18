import { useState } from "react";
import { Room } from "../pages/api/temperatures";
import useSWR from "swr";
import Spinner from "../components/spinner";

import styles from "../styles/temperature.module.css";
import classNames from "classnames";
import Icon from "./icon";
import { fetcher } from "../pages";

type TemperatureProps = {
  className?: string;
  title: React.ReactNode;
  type: "outside" | "inside";
};

const Temperature: React.FC<TemperatureProps> = ({
  className,
  title,
  type,
}) => {
  const [showRooms, setShowRooms] = useState(false);

  const { data, error } = useSWR<Room[]>("/api/temperatures", fetcher, {
    refreshInterval: 60000, // refresh once per minute
    refreshWhenHidden: true,
  });

  if (error)
    return (
      <div className={styles.error}>
        <Icon>error</Icon>
      </div>
    );
  if (!data)
    return (
      <div className={styles.wait}>
        <Spinner />
      </div>
    );

  const rooms = data.filter((d) => d.type === type);

  var temperature =
    rooms.reduce((acc, room) => {
      return acc + room.temperature;
    }, 0) / rooms.length;

  return (
    <div
      className={classNames(className, styles.temperature)}
      onClick={() => setShowRooms(!showRooms)}
    >
      <div className={styles.temperatureTop}>
        <div className={styles.title}>{title}</div>
        <div className={styles.temp}>
          {temperature.toFixed()}
          <span className={styles.degree}>°</span>
        </div>
      </div>
      <div className={styles.temperatureMiddle}>
        <div
          className={classNames(styles.rooms, {
            [styles.collapsed]: !showRooms,
          })}
        >
          {rooms.map((r) => (
            <div key={r.id}>
              <span>{r.name}</span>
              <span>{r.temperature.toFixed()}°</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.temperatureBottom}>
        <Icon>menu</Icon>
      </div>
    </div>
  );
};

export default Temperature;
