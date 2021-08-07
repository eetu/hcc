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
    <div className={styles.card} onClick={() => setShowRooms(!showRooms)}>
      <div className={styles.cardTop}>
        <div className={styles.title}>{title}</div>
        <div className={styles.temperature}>
          {temperature.toPrecision(2)}
          <span className={styles.degree}>°C</span>
        </div>
      </div>
      <div className={styles.cardMiddle}>
        <div
          className={classNames(styles.rooms, {
            [styles.collapsed]: !showRooms,
          })}
        >
          {rooms.map((r) => (
            <div key={r.id}>
              <span>{r.name}</span>
              <span>{r.temperature.toPrecision(2)}&nbsp;°C</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.cardBottom}>
        <Icon>menu</Icon>
      </div>
    </div>
  );
};

export default Temperature;
