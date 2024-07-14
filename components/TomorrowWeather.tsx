import "weather-react-icons/lib/css/weather-icons.css";

import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import useSWR from "swr";
import { WeatherIcon } from "weather-react-icons";

import { fetcher } from "../pages";
import { TomorrowWeatherData } from "../pages/api/weather/tomorrow";
import { getTemperatureSegments } from "../src/utils";
import Arrow from "./Arrow";
import Box from "./Box";
import Icon from "./Icon";
import RaindropIcon from "./RaindropIcon";
import Tooltip from "./Tooltip";
import WeatherChart from "./WeatherChart";

// Tomorrow weather code to owm weather id
const weatherCodeMap: { [key: number]: number } = {
  1000: 800,
  1100: 801,
  1101: 802,
  1102: 803,
  1001: 804,
  2000: 741,
  2100: 701,
  3000: 771,
  3001: 771,
  3002: 771,
  4000: 300,
  4001: 501,
  4200: 500,
  4201: 502,
  5000: 601,
  5001: 621,
  5100: 600,
  5101: 602,
  6000: 611,
  6001: 511,
  6200: 615,
  6201: 616,
  7000: 611,
  7101: 611,
  7102: 611,
  8000: 200,
};

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

type TomorrowWeatherProps = {
  className?: string;
};

const TomorrowWeather: React.FC<TomorrowWeatherProps> = ({ className }) => {
  const { data } = useSWR<TomorrowWeatherData>(
    "/api/weather/tomorrow",
    fetcher,
    {
      refreshInterval: 3600000, // refresh once per hour
      refreshWhenHidden: true,
    }
  );

  const theme = useTheme();

  const weather = data?.data.timelines.find((t) => t.timestep === "current")
    ?.intervals[0];
  const daily =
    data?.data.timelines.find((t) => t.timestep === "1d")?.intervals ?? [];
  const today = daily[0];
  const hourly = data?.data.timelines.find((t) => t.timestep === "1h");
  const alerts: any = [];

  const chartData = daily.map((d) => ({
    temp: d.values.temperature,
    rain: d.values.rainAccumulation || d.values.snowAccumulation || 0,
    label: `${format(new Date(d.startTime), "EEEEEE", {
      locale: fi,
    })}`,
  }));

  const segments = getTemperatureSegments(hourly?.intervals);

  if (!(data && weather && today)) {
    return null;
  }

  const iconId = weatherCodeMap[weather.values.weatherCode];
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
            textTransform: "capitalize",
          }}
        >
          {title}
          {alerts && alerts.length > 0 && (
            <Tooltip
              content={
                <div>
                  {alerts.map((a: any) => (
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
          <WeatherIcon
            css={{
              marginLeft: "25px",
              fontSize: "52px",
              alignSelf: "center",
            }}
            iconId={iconId}
            name="owm"
          />
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
                deg={weather.values.windDirection + 180} // meteorological degrees + 180°
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

export default TomorrowWeather;
