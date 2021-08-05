import { Room } from "../pages/api/temperatures";
import styles from "../styles/temperature.module.css";

type TemperatureProps = {
  room: Room;
};

const Temperature: React.FC<TemperatureProps> = ({ room }) => {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{room.name}</div>
      <div className={styles.temperature}>
        {room.temperature.toPrecision(2)}
        <span className={styles.degree}>°C</span>
      </div>
    </div>
  );
};

export default Temperature;
