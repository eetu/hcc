import "weather-react-icons/lib/css/weather-icons.css";

import classNames from "classnames";
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";
import useSWR from "swr";
import { WeatherIcon } from "weather-react-icons";

import { fetcher } from "../pages";
import { WeatherReponse } from "../pages/api/weather";
import styles from "../styles/weather.module.css";
import Box from "./box";

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

  return (
    <Box
      loading={!data}
      className={classNames(className, styles.weather)}
      drawer={
        data && (
          <div className={styles.days}>
            {data.hourly.slice(0, 24).map((w, idx) => (
              <div className={styles.day} key={idx}>
                <span>{`${format(new Date(w.dt * 1000), "HH:mm EEEEEE", {
                  locale: fiLocale,
                })}`}</span>
                <span>{`${w.temp.toFixed()}°`}</span>
                <WeatherIcon
                  className={styles.hourlyIcon}
                  iconId={w.weather[0].id}
                  name="owm"
                ></WeatherIcon>
                <span>{w.weather[0].description}</span>
              </div>
            ))}
          </div>
        )
      }
    >
      {weather && today && (
        <>
          <div className={styles.current}>
            <div className={styles.title}>{weather.description}</div>
            <div className={styles.currentTemp}>
              <div className={styles.temps}>
                <div className={styles.temp}>
                  {`${data.current.temp.toFixed()}°`}
                </div>
                <div
                  className={styles.feelsLike}
                >{`${data.current.feels_like.toFixed()}°`}</div>
              </div>
              <WeatherIcon
                className={styles.weatherIcon}
                iconId={weather.id}
                name="owm"
              ></WeatherIcon>
            </div>
          </div>
          <div className={styles.daily}>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>aamu</span>
              <span className={styles.sectionTemp}>
                {today.temp.morn.toFixed()}°
              </span>
            </div>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>päivä</span>
              <span className={styles.sectionTemp}>
                {today.temp.day.toFixed()}°
              </span>
            </div>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>ilta</span>
              <span className={styles.sectionTemp}>
                {today.temp.eve.toFixed()}°
              </span>
            </div>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>yö</span>
              <span className={styles.sectionTemp}>
                {today.temp.night.toFixed()}°
              </span>
            </div>
          </div>
        </>
      )}
    </Box>
  );
};

export default Weather;
