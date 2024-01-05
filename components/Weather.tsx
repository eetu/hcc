/** @jsxImportSource @emotion/react */
import "weather-react-icons/lib/css/weather-icons.css";

import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import useSWR from "swr";
import { WeatherIcon } from "weather-react-icons";

import { fetcher } from "../pages";
import { WeatherReponse } from "../pages/api/weather";
import Arrow from "./Arrow";
import Box from "./Box";
import Icon from "./Icon";
import Tooltip from "./Tooltip";
import WeatherChart from "./WeatherChart";

type WeatherProps = {
  className?: string;
};

const Weather: React.FC<WeatherProps> = ({ className }) => {
  const { data } = useSWR<WeatherReponse>("/api/weather", fetcher, {
    refreshInterval: 3600000, // refresh once per hour
    refreshWhenHidden: true,
  });

  const theme = useTheme();

  const weather = data?.current.weather[0];
  const today = data?.daily[0];
  const daily = data?.daily || [];
  const alerts = data?.alerts;

  const chartData = daily.map((d) => ({
    temp: d.temp.day,
    rain: d.snow ?? d.rain ?? 0,
    label: `${format(new Date(d.dt * 1000), "EEEEEE", {
      locale: fi,
    })}`,
  }));

  const sections = today
    ? [
        { title: "aamu", temp: Math.round(today.temp.morn) },
        { title: "päivä", temp: Math.round(today.temp.day) },
        { title: "ilta", temp: Math.round(today.temp.eve) },
        { title: "yö", temp: Math.round(today.temp.night) },
      ]
    : [];

  if (!(data && weather && today)) {
    return null;
  }
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
            textTransform: "capitalize",
          }}
        >
          {weather.description}
          {alerts && alerts.length > 0 && (
            <Tooltip
              content={
                <div>
                  {alerts.map((a) => (
                    <div css={{ fontSize: 13, padding: 5 }} key={a.event}>
                      {a.description}
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
              {`${Math.round(data.current.temp)}°`}
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
            >{`${Math.round(data.current.feels_like)}°`}</div>
          </div>
          <WeatherIcon
            css={{
              marginLeft: "25px",
              fontSize: "52px",
              alignSelf: "center",
            }}
            iconId={weather.id}
            name="owm"
          ></WeatherIcon>
          <div
            css={{
              fontSize: "13px",
              marginLeft: "25px",
            }}
          >
            {(!today.rain || today.snow) && (
              <div
                css={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Icon>{today.snow ? "ac_unit" : "opacity"}</Icon>
                <span css={{ marginLeft: 10 }}>
                  {(today.rain || today.snow)?.toFixed(1)} mm (
                  {(today.pop * 100).toFixed()}
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
                {today.wind_speed.toFixed(1)} m/s
              </span>
              <Arrow
                css={{ marginLeft: 5 }}
                deg={today.wind_deg + 180} // meteorological degrees + 180°
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
        {sections.map((s) => (
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

export default Weather;
