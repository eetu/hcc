import styles from "../styles/weather.module.css";
import classNames from "classnames";
import Icon from "./icon";
import Image, { ImageLoader } from "next/image";
import useSWR from "swr";
import { fetcher } from "../pages";
import Spinner from "./spinner";

type WeatherProps = {};

type Weather = {
  coord: object;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
};

const weatherIconLoader: ImageLoader = ({ src }) => {
  console.log(src);
  return `http://openweathermap.org/img/wn/${src}@2x.png`;
};

const Weather: React.FC<WeatherProps> = ({}) => {
  const { data, error } = useSWR<Weather>("/api/weather", fetcher, {
    refreshInterval: 3600000, // refresh once per hour
    refreshWhenHidden: true,
  });

  if (!data) return <Spinner />;

  const weather = data.weather[0];
  return (
    <div className={styles.weather}>
      <Image
        loader={weatherIconLoader}
        src={{ src: weather.icon, height: 150, width: 150 }}
        alt={weather.main}
      ></Image>
    </div>
  );
};

export default Weather;
