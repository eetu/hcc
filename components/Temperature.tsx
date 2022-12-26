import classNames from "classnames";
import useSWR from "swr";

import { fetcher } from "../pages";
import { Room } from "../pages/api/temperatures";
import styles from "../styles/temperature.module.css";
import Box from "./Box";
import Icon from "./Icon";

type TemperatureProps = {
  className?: string;
  title: React.ReactNode;
  type: "outside" | "inside" | "inside_cold";
};

const isBatteryLow = (room: Room) =>
  room.battery !== undefined && room.battery < 10;

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

  const enabledRooms = rooms.filter((r) => r.enabled);

  var temperature =
    enabledRooms.reduce((acc, room) => {
      return acc + room.temperature;
    }, 0) / enabledRooms.length;

  const isAnyBatteryLow = !!rooms.find(isBatteryLow);

  return (
    <Box
      className={classNames(className)}
      loading={!data}
      error={error}
      drawer={
        rooms && (
          <div className={classNames(styles.rooms)}>
            {rooms.map((r) => {
              const isRoomBatteryLow = isBatteryLow(r);
              return (
                <div
                  key={r.id}
                  className={classNames(styles.room, {
                    [styles.disabled]: !r.enabled,
                  })}
                >
                  <span>{r.name}</span>
                  {isRoomBatteryLow ? (
                    <Icon
                      className={classNames(styles.batteryIcon, {
                        [`${styles.batteryWarning}`]: isRoomBatteryLow,
                      })}
                      size="normal"
                    >{`battery_${getBatteryStr(r.battery)}`}</Icon>
                  ) : (
                    <>&nbsp;</>
                  )}
                  <span>{Math.round(r.temperature)}°</span>
                </div>
              );
            })}
          </div>
        )
      }
    >
      <div className={styles.temperature}>
        {isAnyBatteryLow && (
          <Icon
            className={classNames(
              styles.batteryTitle,
              styles.batteryIcon,
              styles.batteryWarning
            )}
          >{`battery_${getBatteryStr(0)}`}</Icon>
        )}
        <div className={styles.title}>{title}</div>
        <div className={styles.temp}>
          {Math.round(temperature)}
          <span className={styles.degree}>°</span>
        </div>
      </div>
    </Box>
  );
};

const getBatteryStr = (value: number = 100) => {
  if (value > 95) {
    return "full";
  } else if (value > 85) {
    return "6_bar";
  } else if (value > 70) {
    return "5_bar";
  } else if (value > 50) {
    return "4_bar";
  } else if (value > 30) {
    return "3_bar";
  } else if (value > 10) {
    return "2_bar";
  } else if (value > 0) {
    return "1_bar";
  }
  return "0_bar";
};

export default Temperature;
