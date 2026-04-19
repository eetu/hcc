import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { useMemo } from "react";
import useSWR from "swr";

import { api, fetcher } from "../api";
import { getTemperatureRoast } from "../temperatureRoast";
import { WeatherData } from "../types/weather";
import { getFmiTemperatureSegments } from "../utils";
import { getFmiWeatherDescription, getFmiWeatherIcon } from "../weatherIcons";
import Arrow from "./Arrow";
import Box from "./Box";
import Icon from "./Icon";
import RaindropIcon from "./RaindropIcon";
import WeatherChart from "./WeatherChart";

type WeatherBoxProps = {
  className?: string;
};

const WeatherBox: React.FC<WeatherBoxProps> = ({ className }) => {
  const { data } = useSWR<WeatherData>(api("/api/weather/fmi"), fetcher, {
    refreshInterval: 3600000,
    refreshWhenHidden: true,
  });

  const theme = useTheme();

  const current = data?.current;
  const daily = data?.daily ?? [];
  const today = daily[0];
  const hourly = data?.hourly;

  const chartData = daily.map((d) => ({
    temp: d.temperatureMax,
    rain: d.precipitation,
    label: `${format(new Date(d.date), "EEEEEE", {
      locale: fi,
    })}`,
  }));

  const segments = getFmiTemperatureSegments(hourly);

  const currentTemp = current?.temperature;
  const roundedTemp =
    currentTemp !== undefined ? Math.round(currentTemp) : undefined;
  /* eslint-disable react-hooks/exhaustive-deps -- intentionally keyed on roundedTemp to avoid re-randomizing on fractional changes */
  const roast = useMemo(
    () => (currentTemp !== undefined ? getTemperatureRoast(currentTemp) : null),
    [roundedTemp],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!(data && current && today)) {
    return null;
  }

  const now = new Date();
  const isNight =
    now < new Date(current.sunrise) || now > new Date(current.sunset);
  const title = getFmiWeatherDescription(current.weatherSymbol);

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
              {`${Math.round(current.temperature)}°`}
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
            >{`${Math.round(current.temperatureApparent)}°`}</div>
          </div>
          {(() => {
            const IconComponent = getFmiWeatherIcon(current.weatherSymbol, isNight);
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
            {today.precipitation > 0 && (
              <div
                css={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {today.precipitationType === "snow" ? (
                  <Icon>ac_unit</Icon>
                ) : (
                  <RaindropIcon />
                )}
                <span css={{ marginLeft: 10 }}>
                  {today.precipitation.toFixed(1)} mm
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
                {current.windSpeed.toFixed(1)} m/s
              </span>
              <Arrow
                css={{ marginLeft: 5 }}
                deg={current.windDirection + 180}
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

export default WeatherBox;
