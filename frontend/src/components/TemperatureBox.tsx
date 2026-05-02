import { useTheme } from "@emotion/react";
import classNames from "classnames";
import { memo } from "react";

import useScreenshotMode, { anonymize } from "../hooks/useScreenshotMode";
import useSensorTrend from "../hooks/useSensorTrend";
import { mq } from "../mq";
import { Sensor } from "../types/hue";
import Box, { DrawerRow } from "./Box";
import Icon from "./Icon";
import OfflineState from "./OfflineState";
import TrendIndicator from "./TrendIndicator";

type TemperatureBoxProps = {
  className?: string;
  title: React.ReactNode;
  sensors?: Sensor[];
  error?: boolean;
  temperatureOverride?: number;
};

const isBatteryLow = (sensor: Sensor) =>
  sensor.battery !== undefined && sensor.battery < 10;

const TemperatureBox: React.FC<TemperatureBoxProps> = ({
  className,
  title,
  sensors = [],
  error,
  temperatureOverride,
}) => {
  const theme = useTheme();
  const trend = useSensorTrend(sensors);
  const demo = useScreenshotMode();

  const enabledSensors = sensors?.filter((r) => r.enabled);

  const temperature =
    temperatureOverride ??
    enabledSensors.reduce((acc, room) => {
      if (room.temperature === undefined) return acc;
      return acc + room.temperature;
    }, 0) / enabledSensors.length;

  const sensorWithLowBattery = sensors.find(isBatteryLow);

  if (error) {
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
      >
        <OfflineState label={typeof title === "string" ? title : "anturit"} />
      </Box>
    );
  }

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
      drawer={
        <div
          css={{
            backgroundColor: theme.colors.background.light,
            padding: "5px",
            display: "flex",
            flexDirection: "column",
            gap: "0.5em",
            fontSize: "14px",
          }}
        >
          {sensors.map((r) => {
            const isSensorBatteryLow = isBatteryLow(r);
            return (
              <div
                key={r.id}
                css={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  backgroundColor: theme.colors.background.light,
                }}
              >
                <DrawerRow
                  label={
                    <div
                      css={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {demo ? anonymize(r.id, "anturi") : r.name}
                      {isSensorBatteryLow && (
                        <Icon
                          size={18}
                          css={{
                            color: theme.colors.error,
                          }}
                        >{`battery_${getBatteryStr(r.battery)}`}</Icon>
                      )}
                    </div>
                  }
                  value={
                    <>
                      <span>
                        {r.temperature !== undefined
                          ? `${Math.round(r.temperature)}°`
                          : ""}
                      </span>
                    </>
                  }
                />
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
              top: -16,
              right: -16,
              display: "block",
              color: theme.colors.error,
            }}
          >{`battery_${getBatteryStr(sensorWithLowBattery.battery)}`}</Icon>
        )}
        <div
          css={{
            ...theme.typography.label,
            color: theme.colors.text.muted,
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </div>
        <div
          css={{
            position: "relative",
            marginTop: "5px",
            display: "flex",
            fontWeight: 400,
            fontSize: 50,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(temperature)}
          <span>°</span>
          {trend && trend !== "stable" && (
            <div
              css={{
                position: "absolute",
                right: -25,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                opacity: 0.75,
              }}
            >
              <TrendIndicator trend={trend} />
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

export default memo(TemperatureBox);
