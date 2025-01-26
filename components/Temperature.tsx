import { useTheme } from "@emotion/react";
import classNames from "classnames";

import { mq } from "../pages";
import { Sensor } from "../pages/api/hue";
import Box from "./Box";
import Icon from "./Icon";

type TemperatureProps = {
  className?: string;
  title: React.ReactNode;
  sensors?: Sensor[];
  error?: any;
};

const isBatteryLow = (sensor: Sensor) =>
  sensor.battery !== undefined && sensor.battery < 10;

const Temperature: React.FC<TemperatureProps> = ({
  className,
  title,
  sensors = [],
  error,
}) => {
  const theme = useTheme();

  const enabledSensors = sensors?.filter((r) => r.enabled);

  var temperature =
    enabledSensors.reduce((acc, room) => {
      return acc + room.temperature;
    }, 0) / enabledSensors.length;

  const sensorWithLowBattery = sensors.find(isBatteryLow);

  return (
    <Box
      className={classNames(className)}
      css={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        [mq[0]]: {
          width: "100%",
        },
      }}
      loading={sensors.length === 0}
      error={error}
      drawer={
        <div
          css={{
            display: "table",
            fontSize: "16px",
          }}
        >
          {sensors.map((r) => {
            const isSensorBatteryLow = isBatteryLow(r);
            return (
              <div
                key={r.id}
                css={{
                  display: "table-row",
                  backgroundColor: theme.colors.background.light,
                  "& span": {
                    display: "table-cell",
                    padding: "5px",
                    opacity: r.enabled ? 1 : 0.25,
                    width: "100%",
                  },
                }}
              >
                <span>{r.name}</span>
                {isSensorBatteryLow ? (
                  <Icon
                    size={18}
                    css={{
                      color: theme.colors.error,
                      transform: "rotate(90deg)",
                    }}
                  >{`battery_${getBatteryStr(r.battery)}`}</Icon>
                ) : (
                  <span>&nbsp;</span>
                )}
                <span>{Math.round(r.temperature)}°</span>
              </div>
            );
          })}
        </div>
      }
    >
      <div
        css={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {sensorWithLowBattery && (
          <Icon
            css={{
              position: "absolute",
              top: 0,
              right: 0,
              display: "block",
              color: theme.colors.error,
            }}
          >{`battery_${getBatteryStr(sensorWithLowBattery.battery)}`}</Icon>
        )}
        <div
          css={{
            fontWeight: "normal",
            fontSize: 18,
            textTransform: "capitalize",
          }}
        >
          {title}
        </div>
        <div
          css={{
            marginTop: "5px",
            display: "flex",
            fontWeight: "normal",
            fontSize: "50px",
          }}
        >
          {Math.round(temperature)}
          <span>°</span>
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
