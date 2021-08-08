import styles from "../styles/weather.module.css";
import classNames from "classnames";
import Icon from "./icon";
import useSWR from "swr";
import { fetcher } from "../pages";
import Spinner from "./spinner";
import "weather-react-icons/lib/css/weather-icons.css";
import { WeatherIcon } from "weather-react-icons";
import { WeatherReponse } from "../pages/api/weather";

type WeatherProps = {};

const Weather: React.FC<WeatherProps> = ({}) => {
  const { data, error } = useSWR<WeatherReponse>("/api/weather", fetcher, {
    refreshInterval: 3600000, // refresh once per hour
    refreshWhenHidden: true,
  });

  if (!data) return <Spinner />;

  const weather = data.current.weather[0];
  const today = data.daily[0];
  console.log(today);

  return (
    <div className={styles.weather}>
      <div className={styles.title}>{weather.description}</div>
      <div className={styles.current}>
        <div>
          <div className={styles.temp}>
            {`${data.current.feels_like.toPrecision(2)}°`}
          </div>
          <div className={styles.description}>Tuntuu kuin</div>
        </div>
        <WeatherIcon
          className={styles.weatherIcon}
          iconId={weather.id}
          name="owm"
        ></WeatherIcon>
      </div>
    </div>
  );
};

export default Weather;
