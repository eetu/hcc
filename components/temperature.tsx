import { useState } from "react";
import { Room } from "../pages/api/temperatures";
import styles from "../styles/temperature.module.css";

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
      <div className={styles.title}>{title}</div>
      <div className={styles.temperature}>
        {temperature.toPrecision(2)}
        <span className={styles.degree}>°C</span>
      </div>
      {showRooms && (
        <div className={styles.rooms}>
          {rooms.map((r) => (
            <div key={r.id}>
              <span>{r.name}</span>
              <span>{r.temperature.toPrecision(2)}&nbsp;°C</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Temperature;
