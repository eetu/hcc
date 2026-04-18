import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { useMemo } from "react";
import useSWR from "swr";

import { api, fetcher } from "../api";
import { getTemperatureRoast } from "../temperatureRoast";
import { TomorrowWeatherData } from "../types/weather";
import { getTemperatureSegments } from "../utils";
import { getWeatherIcon } from "../weatherIcons";
import Arrow from "./Arrow";
import Box from "./Box";
import Icon from "./Icon";
import RaindropIcon from "./RaindropIcon";
import Tooltip from "./Tooltip";
import WeatherChart from "./WeatherChart";

const weatherCode: Record<number, string> = {
  1000: "Selkeä, Aurinkoinen",
  1100: "Enimmäkseen Selkeä",
  1101: "Osittain Pilvinen",
  1102: "Enimmäkseen Pilvinen",
  1001: "Pilvinen",
  2000: "Sumu",
  2100: "Kevyt Sumu",
  4000: "Tihkusade",
  4001: "Sade",
  4200: "Kevyt Sade",
  4201: "Rankkasade",
  5000: "Lumisade",
  5001: "Lumikuurot",
  5100: "Kevyt Lumisade",
  5101: "Rankka Lumisade",
  6000: "Jäätävä Tihku",
  6001: "Jäätävä Sade",
  6200: "Kevyt Jäätävä Sade",
  6201: "Rankka Jäätävä Sade",
  7000: "Raesade",
  7101: "Rankka Raesade",
  7102: "Kevyt Raesade",
  8000: "Ukkosmyrsky",
};

type TomorrowWeatherBoxProps = {
  className?: string;
};

const TomorrowWeatherBox: React.FC<TomorrowWeatherBoxProps> = ({
  className,
}) => {
  const { data } = useSWR<TomorrowWeatherData>(
    api("/api/weather/tomorrow"),
    fetcher,
    {
      refreshInterval: 3600000,
      refreshWhenHidden: true,
    },
  );

  const theme = useTheme();

  const weather = data?.data.timelines.find((t) => t.timestep === "current")
    ?.intervals[0];
  const daily =
    data?.data.timelines.find((t) => t.timestep === "1d")?.intervals ?? [];
  const today = daily[0];
  const hourly = data?.data.timelines.find((t) => t.timestep === "1h");
  const alerts: { code: number; message: string }[] = [];

  const chartData = daily.map((d) => ({
    temp: d.values.temperature,
    rain: d.values.rainAccumulation || d.values.snowAccumulation || 0,
    label: `${format(new Date(d.startTime), "EEEEEE", {
      locale: fi,
    })}`,
  }));

  const segments = getTemperatureSegments(hourly?.intervals);

  const currentTemp = weather?.values.temperature;
  const roundedTemp =
    currentTemp !== undefined ? Math.round(currentTemp) : undefined;
  /* eslint-disable react-hooks/exhaustive-deps -- intentionally keyed on roundedTemp to avoid re-randomizing on fractional changes */
  const roast = useMemo(
    () => (currentTemp !== undefined ? getTemperatureRoast(currentTemp) : null),
    [roundedTemp],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!(data && weather && today)) {
    return null;
  }

  const title = weatherCode[weather.values.weatherCode];

  return (
    <Box
      loading={!data}
      className={className}
      drawer={
        <div
          css={{
            position: "relative",
            backgroundColor: theme.colors.background.light,
            height: "200px",
            padding: 10,
          }}
        >
          <WeatherChart data={chartData} />
        </div>
      }
    >
      <div
        css={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          css={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            textTransform: "capitalize",
          }}
        >
          {title}
          <span
            css={{
              ...theme.typography.caption,
              color: theme.colors.text.muted,
              textTransform: "none",
            }}
          >
            {roast}
          </span>
          {alerts && alerts.length > 0 && (
            <Tooltip
              content={
                <div>
                  {alerts.map((a) => (
                    <div css={{ fontSize: 13, padding: 5 }} key={a.code}>
                      {a.message}
                    </div>
                  ))}
                </div>
              }
            >
              <div css={{ marginLeft: 15 }}>
                <Icon type="normal" css={{ color: theme.colors.error }}>
                  announcement
                </Icon>
              </div>
            </Tooltip>
          )}
        </div>
        <div
          css={{
            display: "flex",
            marginTop: "15px",
            alignItems: "center",
          }}
        >
          <div css={{ display: "flex" }}>
            <div
              css={{
                display: "flex",
                fontWeight: "normal",
                fontSize: "50px",
              }}
            >
              {`${Math.round(weather.values.temperature)}°`}
            </div>
            <div
              css={{
                display: "flex",
                alignItems: "flex-end",
                fontSize: "20px",
                fontWeight: "lighter",
                alignSelf: "bottom",
                marginBottom: "5px",
              }}
            >{`${Math.round(weather.values.temperatureApparent)}°`}</div>
          </div>
          {(() => {
            const IconComponent = getWeatherIcon(weather.values.weatherCode);
            return (
              <IconComponent
                css={{
                  marginLeft: "25px",
                  alignSelf: "center",
                }}
                size={52}
              />
            );
          })()}
          <div
            css={{
              fontSize: "13px",
              marginLeft: "25px",
            }}
          >
            {(today.values.rainAccumulation > 0 ||
              today.values.snowAccumulation > 0) && (
              <div
                css={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {today.values.rainAccumulation > 0 ? (
                  <RaindropIcon />
                ) : (
                  <Icon>ac_unit</Icon>
                )}
                <span css={{ marginLeft: 10 }}>
                  {(
                    today.values.rainAccumulation ||
                    today.values.snowAccumulation
                  ).toFixed(1)}{" "}
                  mm ({today.values.precipitationProbabilityAvg.toFixed()}
                  %)
                </span>
              </div>
            )}
            <div
              css={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Icon>air</Icon>
              <span css={{ marginLeft: 10 }}>
                {weather.values.windSpeed.toFixed(1)} m/s
              </span>
              <Arrow
                css={{ marginLeft: 5 }}
                deg={weather.values.windDirection + 180}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        css={{
          position: "relative",
          display: "flex",
          marginTop: "1.5em",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        {segments.map((s) => (
          <div
            key={s.title}
            css={{
              display: "flex",
              flexDirection: "column",
              borderRight: `1px ${theme.colors.border} solid`,
              width: "25%",
              textAlign: "center",
              "&:last-of-type": {
                borderRight: "none",
              },
            }}
          >
            <span css={{ fontWeight: "lighter" }}>{s.title}</span>
            <span css={{ marginTop: 0.25 }}>{s.temp}°</span>
          </div>
        ))}
      </div>
    </Box>
  );
};

export default TomorrowWeatherBox;
