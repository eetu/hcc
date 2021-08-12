import styles from "../styles/weather.module.css";
import classNames from "classnames";
import Icon from "./icon";
import useSWR from "swr";
import { fetcher } from "../pages";
import Spinner from "./spinner";
import "weather-react-icons/lib/css/weather-icons.css";
import { WeatherIcon } from "weather-react-icons";
import { WeatherReponse } from "../pages/api/weather";
import { useState } from "react";
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";

type WeatherProps = {
  className?: string;
};

const Weather: React.FC<WeatherProps> = ({ className }) => {
  const { data, error } = useSWR<WeatherReponse>("/api/weather", fetcher, {
    refreshInterval: 3600000, // refresh once per hour
    refreshWhenHidden: true,
  });
  const [showDays, setshowDays] = useState(false);

  if (!data)
    return (
      <div className={styles.weather}>
        <div className={styles.weatherTop}>
          <div className={styles.current}>
            <Spinner />
          </div>
        </div>
        <div className={styles.weatherBottom}></div>
      </div>
    );

  const weather = data.current.weather[0];
  const today = data.daily[0];

  return (
    <div
      className={classNames(className, styles.weather, {
        [styles.collapsed]: !showDays,
      })}
      onClick={() => setshowDays(!showDays)}
    >
      <div className={styles.weatherTop}>
        <div className={styles.current}>
          <div className={styles.title}>{weather.description}</div>
          <div className={styles.currentTemp}>
            <div>
              <div className={styles.temp}>
                {`${data.current.feels_like.toPrecision(2)}°`}
              </div>
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
              {today.feels_like.morn.toPrecision(2)}°
            </span>
          </div>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>päivä</span>
            <span className={styles.sectionTemp}>
              {today.feels_like.day.toPrecision(2)}°
            </span>
          </div>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>ilta</span>
            <span className={styles.sectionTemp}>
              {today.feels_like.eve.toPrecision(2)}°
            </span>
          </div>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>yö</span>
            <span className={styles.sectionTemp}>
              {today.feels_like.night.toPrecision(2)}°
            </span>
          </div>
        </div>
      </div>
      <div className={styles.weatherMiddle}>
        <div className={styles.daysWrapper}>
          <div className={styles.days}>
            {data.hourly.slice(0, 24).map((w, idx) => (
              <div key={idx}>
                <span>{`${format(new Date(w.dt * 1000), "HH:mm EEEEEE", {
                  locale: fiLocale,
                })}`}</span>
                <span>{`${w.feels_like.toPrecision(2)}°`}</span>
                <WeatherIcon
                  className={styles.hourlyIcon}
                  iconId={w.weather[0].id}
                  name="owm"
                ></WeatherIcon>
                <span>{w.weather[0].description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.weatherBottom}>
        <Icon>menu</Icon>
      </div>
    </div>
  );
};

export default Weather;
