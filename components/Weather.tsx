import "weather-react-icons/lib/css/weather-icons.css";

import classNames from "classnames";
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";
import { WeatherIcon } from "weather-react-icons";

import { fetcher } from "../pages";
import { WeatherReponse } from "../pages/api/weather";
import styles from "../styles/weather.module.css";
import Arrow from "./Arrow";
import Box from "./Box";
import Icon from "./Icon";

type WeatherProps = {
  className?: string;
};

const Weather: React.FC<WeatherProps> = ({ className }) => {
  const { data } = useSWR<WeatherReponse>("/api/weather", fetcher, {
    refreshInterval: 3600000, // refresh once per hour
    refreshWhenHidden: true,
  });

  const weather = data?.current.weather[0];
  const today = data?.daily[0];
  const rest = data?.daily.slice(1) || [];
  const alerts = data?.alerts;

  const chartData = rest.map((d) => ({
    temp: d.temp.day,
    rain: d.snow ?? d.rain ?? 0,
    label: `${format(new Date(d.dt * 1000), "EEEEEE", {
      locale: fiLocale,
    })}`,
  }));

  const weatherLineColor = chartData[0]?.temp < 5 ? "#1a5276" : "#ff5733";

  const sections = today
    ? [
        { title: "aamu", temp: Math.round(today.temp.morn) },
        { title: "päivä", temp: Math.round(today.temp.day) },
        { title: "ilta", temp: Math.round(today.temp.eve) },
        { title: "yö", temp: Math.round(today.temp.night) },
      ]
    : [];

  return (
    <Box
      loading={!data}
      className={classNames(className, styles.weather)}
      drawer={
        <div className={styles.days}>
          <ResponsiveContainer height={200} width="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                stroke="lightgrey"
                vertical={false}
                strokeWidth={1}
                strokeDasharray="2 4"
              ></CartesianGrid>
              <XAxis dataKey="label"></XAxis>
              <YAxis yAxisId="temp" allowDecimals={false} unit="°"></YAxis>
              <YAxis
                yAxisId="rain"
                orientation="right"
                allowDecimals={false}
                unit="mm"
              ></YAxis>
              <Bar dataKey="rain" fill="#94daf7" yAxisId="rain"></Bar>
              <Line
                type="linear"
                dataKey="temp"
                stroke={weatherLineColor}
                dot={false}
                strokeWidth={2}
                yAxisId="temp"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      }
    >
      {data && weather && today && (
        <>
          <div className={styles.current}>
            <div className={styles.title}>
              {weather.description}
              {alerts && alerts.length > 0 && (
                <Icon type="normal" className={styles.warningIcon}>
                  announcement
                </Icon>
              )}
            </div>
            <div className={styles.currentTemp}>
              <div className={styles.temps}>
                <div className={styles.temp}>
                  {`${Math.round(data.current.temp)}°`}
                </div>
                <div className={styles.feelsLike}>{`${Math.round(
                  data.current.feels_like
                )}°`}</div>
              </div>
              <WeatherIcon
                className={styles.weatherIcon}
                iconId={weather.id}
                name="owm"
              ></WeatherIcon>
              <div className={styles.info}>
                {(today.rain || today.snow) && (
                  <div className={styles.infoRow}>
                    <Icon>{today.snow ? "ac_unit" : "opacity"}</Icon>
                    <span>
                      {(today.rain || today.snow)?.toFixed(1)} mm (
                      {(today.pop * 100).toFixed()}
                      %)
                    </span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <Icon>air</Icon>
                  <span>{today.wind_speed.toFixed(1)} m/s</span>
                  <Arrow
                    className={styles.windArrow}
                    deg={today.wind_deg + 180} // meteorological degrees + 180°
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.daily}>
            {sections.map((s) => (
              <div key={s.title} className={styles.section}>
                <span className={styles.sectionTitle}>{s.title}</span>
                <span className={styles.sectionTemp}>{s.temp}°</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Box>
  );
};

export default Weather;
