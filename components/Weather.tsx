import "weather-react-icons/lib/css/weather-icons.css";

import classNames from "classnames";
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";
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
  const alerts = data?.alerts;

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
        data &&
        alerts && (
          <>
            {alerts.length > 0 && (
              <div className={styles.alerts}>
                {alerts?.map((alert, idx) => (
                  <div key={idx} className={styles.alert}>
                    <span>
                      {`${format(new Date(alert.start * 1000), "HH:mm EEEEEE", {
                        locale: fiLocale,
                      })}`}
                      &nbsp;-&nbsp;
                      {`${format(new Date(alert.end * 1000), "HH:mm EEEEEE", {
                        locale: fiLocale,
                      })}`}
                    </span>
                    <span>{alert.description}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.days}>
              {data.hourly.slice(0, 24).map((w, idx) => (
                <div className={styles.day} key={idx}>
                  <span>{`${format(new Date(w.dt * 1000), "HH:mm EEEEEE", {
                    locale: fiLocale,
                  })}`}</span>
                  <span>{`${Math.round(w.temp)}°`}</span>
                  <WeatherIcon
                    className={styles.hourlyIcon}
                    iconId={w.weather[0].id}
                    name="owm"
                  ></WeatherIcon>
                  <span>{w.weather[0].description}</span>
                  <span>
                    {(w.rain?.["1h"] || w.snow?.["1h"]) && (
                      <>
                        {(w.rain?.["1h"] || w.snow?.["1h"] || 0).toFixed(1)} mm
                        ({(w.pop * 100).toFixed()}%)
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </>
        )
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
