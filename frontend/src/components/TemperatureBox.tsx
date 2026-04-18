import { useTheme } from "@emotion/react";
import classNames from "classnames";

import useSensorTrend from "../hooks/useSensorTrend";
import { mq } from "../mq";
import { Sensor } from "../types/hue";
import Box from "./Box";
import Icon from "./Icon";
import TrendIndicator from "./TrendIndicator";

type TemperatureBoxProps = {
  className?: string;
  title: React.ReactNode;
  sensors?: Sensor[];
  error?: boolean;
};

const isBatteryLow = (sensor: Sensor) =>
  sensor.battery !== undefined && sensor.battery < 10;

const TemperatureBox: React.FC<TemperatureBoxProps> = ({
  className,
  title,
  sensors = [],
  error,
}) => {
  const theme = useTheme();
  const trend = useSensorTrend(sensors);

  const enabledSensors = sensors?.filter((r) => r.enabled);

  const temperature =
    enabledSensors.reduce((acc, room) => {
      if (room.temperature === undefined) return acc;
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
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  backgroundColor: theme.colors.background.light,
                  "& span": {
                    display: "table-cell",
                    padding: "5px",
                    opacity: r.enabled && r.connected ? 1 : 0.25,
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
                <span>
                  {r.temperature !== undefined
                    ? `${Math.round(r.temperature)}°`
                    : ""}
                </span>
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
            position: "relative",
            marginTop: "5px",
            display: "flex",
            fontWeight: "normal",
            fontSize: "50px",
          }}
        >
          {Math.round(temperature)}
          <span>°</span>
          {trend && trend !== "stable" && (
            <div
              css={{
                position: "absolute",
                right: -36,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <TrendIndicator trend={trend} size={32} />
            </div>
          )}
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

export default TemperatureBox;
