import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { memo } from "react";
import useSWR from "swr";

import { api, fetcher } from "../api";
import useLocationSettings from "../hooks/useLocationSettings";
import { WeatherData } from "../types/weather/fmi";
import {
  getFmiWeatherDescription,
  getFmiWeatherIcon,
} from "../weather/fmi/icons";
import { getFmiTemperatureSegments } from "../weather/fmi/utils";
import Arrow from "./Arrow";
import Box from "./Box";
import Icon from "./Icon";
import LocationForm from "./LocationForm";
import RaindropIcon from "./RaindropIcon";
import WeatherChart from "./WeatherChart";

type WeatherBoxProps = {
  className?: string;
};

const WeatherBox: React.FC<WeatherBoxProps> = ({ className }) => {
  const theme = useTheme();
  const { location, isLoading: locationLoading } = useLocationSettings();

  const weatherUrl = location
    ? api(`/api/weather/fmi?lat=${location.lat}&lon=${location.lon}`)
    : null;

  const { data } = useSWR<WeatherData>(weatherUrl, fetcher, {
    refreshInterval: 3600000,
    refreshWhenHidden: true,
  });

  const current = data?.current;
  const daily = data?.daily ?? [];
  const today = daily[0];
  const hourly = data?.hourly;

  if (!location && !locationLoading) {
    return (
      <Box className={className}>
        <div css={{ padding: "1em 0" }}>
          <div
            css={{
              ...theme.typography.body1,
              color: theme.colors.text.main,
              marginBottom: "1em",
              textAlign: "center",
            }}
          >
            Set your location to see weather
          </div>
          <LocationForm />
        </div>
      </Box>
    );
  }

  if (!(data && current && today)) {
    return null;
  }

  const chartData = daily.map((d) => ({
    temp: d.temperatureMax,
    rain: d.precipitation,
    label: `${format(new Date(d.date), "EEEEEE", {
      locale: fi,
    })}`,
  }));

  const segments = getFmiTemperatureSegments(hourly);

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
            {location?.displayName ?? ""}
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
            const IconComponent = getFmiWeatherIcon(
              current.weatherSymbol,
              isNight,
            );
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

export default memo(WeatherBox);
