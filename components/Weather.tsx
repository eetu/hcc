import "weather-react-icons/lib/css/weather-icons.css";

import classNames from "classnames";
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";
import useSWR from "swr";
import { WeatherIcon } from "weather-react-icons";

import { fetcher } from "../pages";
import { WeatherReponse } from "../pages/api/weather";
import styles from "../styles/weather.module.css";
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

  console.log(alerts);

  const sections = today
    ? [
        { title: "aamu", temp: today.temp.morn.toFixed() },
        { title: "päivä", temp: today.temp.day.toFixed() },
        { title: "ilta", temp: today.temp.eve.toFixed() },
        { title: "yö", temp: today.temp.night.toFixed() },
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
                {alerts?.map((alert) => (
                  <div key={alert.event} className={styles.alert}>
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
          </>
        )
      }
    >
      {data && weather && today && alerts && (
        <>
          <div className={styles.current}>
            <div className={styles.title}>
              {weather.description}
              {alerts.length > 0 && (
                <Icon type="normal" className={styles.warning}>
                  announcement
                </Icon>
              )}
            </div>
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
              <div className={styles.info}>
                <div className={styles.infoRow}>
                  <Icon>{today.snow ? "ac_unit" : "opacity"}</Icon>
                  <span>
                    {today.rain || today.snow} mm ({(today.pop * 100).toFixed()}
                    %)
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <Icon>air</Icon>
                  <span>{today.wind_speed ?? 0} m/s</span>
                  <Icon style={{ rotate: `${today.wind_deg}deg` }}>
                    arrow_downward
                  </Icon>
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
