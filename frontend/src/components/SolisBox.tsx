import { useTheme } from "@emotion/react";
import { memo } from "react";
import useSWR from "swr";

import { api, fetcher } from "../api";
import { SolisData } from "../types/solis";
import Box, { DrawerRow } from "./Box";
import Icon from "./Icon";

type SolisBoxProps = {
  className?: string;
};

const SolisBox: React.FC<SolisBoxProps> = ({ className }) => {
  const theme = useTheme();

  const { data, error } = useSWR<SolisData>(api("/api/solis"), fetcher, {
    refreshInterval: 300_000,
    refreshWhenHidden: true,
    shouldRetryOnError: false,
  });

  if (!data || error) return null;

  const isAlarm = data.status === 3;
  const displayPower = data.power.toFixed(1);

  const batteryLabel =
    data.battery_power !== null
      ? data.battery_power > 0
        ? "lataa"
        : data.battery_power < 0
          ? "purkaa"
          : "lepotila"
      : null;

  return (
    <Box
      className={className}
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
          <DrawerRow
            label="Tänään"
            value={`${data.today_energy} ${data.today_energy_unit}`}
          />
          <DrawerRow
            label="Kk"
            value={`${data.month_energy} ${data.month_energy_unit}`}
          />
          {data.battery_soc !== null && (
            <>
              <DrawerRow
                label="Akku"
                value={`${Math.round(data.battery_soc)}%`}
              />
              {data.battery_power !== null && data.battery_power_unit && (
                <DrawerRow
                  label={`${batteryLabel}`}
                  value={`${Math.abs(data.battery_power).toFixed(2)} ${data.battery_power_unit}`}
                />
              )}
            </>
          )}
        </div>
      }
    >
      <div
        css={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <div
          css={{
            fontWeight: "normal",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: "0.3em",
          }}
        >
          <Icon
            size={18}
            css={{
              color: isAlarm ? theme.colors.error : "inherit",
              opacity: 0.7,
            }}
          >
            {isAlarm ? "warning" : "solar_power"}
          </Icon>
          {data.power_unit}
        </div>
        <div
          css={{
            marginTop: "5px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            css={{
              fontWeight: "normal",
              fontSize: "50px",
            }}
          >
            {displayPower}
          </div>
        </div>
      </div>
    </Box>
  );
};

export default memo(SolisBox);
