import { useState } from "react";
import { Room } from "../pages/api/temperatures";
import styles from "../styles/temperature.module.css";
import classNames from "classnames";
import Icon from "./icon";

type TemperatureProps = {
  temperature: number;
  title: React.ReactNode;
  rooms: Room[];
};

const Temperature: React.FC<TemperatureProps> = ({
  rooms,
  title,
  temperature,
}) => {
  const [showRooms, setShowRooms] = useState(false);

  return (
    <div
      className={styles.temperature}
      onClick={() => setShowRooms(!showRooms)}
    >
      <div className={styles.temperatureTop}>
        <div className={styles.title}>{title}</div>
        <div className={styles.temp}>
          {temperature.toPrecision(2)}
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
              <span>{r.temperature.toPrecision(2)}&nbsp;°</span>
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
