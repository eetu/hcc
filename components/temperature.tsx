import classNames from "classnames";
import useSWR from "swr";

import { fetcher } from "../pages";
import { Room } from "../pages/api/temperatures";
import styles from "../styles/temperature.module.css";
import Box from "./box";

type TemperatureProps = {
  className?: string;
  title: React.ReactNode;
  type: "outside" | "inside" | "inside_cold";
};

const Temperature: React.FC<TemperatureProps> = ({
  className,
  title,
  type,
}) => {
  const { data, error } = useSWR<Room[]>("/api/temperatures", fetcher, {
    refreshInterval: 60000, // refresh once per minute
    refreshWhenHidden: true,
  });

  const rooms = data ? data.filter((d) => d.type === type) : [];

  var temperature =
    rooms.reduce((acc, room) => {
      return acc + room.temperature;
    }, 0) / rooms.length;

  return (
    <Box
      className={classNames(className)}
      loading={!data}
      error={error}
      drawer={
        rooms && (
          <div className={classNames(styles.rooms)}>
            {rooms.map((r) => (
              <div key={r.id}>
                <span>{r.name}</span>
                <span>{r.temperature.toFixed()}°</span>
              </div>
            ))}
          </div>
        )
      }
    >
      <div className={styles.temperature}>
        <div className={styles.title}>{title}</div>
        <div className={styles.temp}>
          {temperature.toFixed()}
          <span className={styles.degree}>°</span>
        </div>
      </div>
    </Box>
  );
};

export default Temperature;
