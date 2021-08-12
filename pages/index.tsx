//export const config = { amp: true };
import useSWR from "swr";
import { Room } from "./api/temperatures";
import styles from "../styles/temperatures.module.css";
import Temperature from "../components/temperature";
import Head from "next/head";
import Icon from "../components/icon";
import Spinner from "../components/spinner";
import Weather from "../components/weather";
import { format } from "date-fns";
import useCurrentTime from "../components/useCurrentTime";
import fiLocale from "date-fns/locale/fi";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Temperatures(props: any) {
  const { data, error } = useSWR<Room[]>("/api/temperatures", fetcher, {
    refreshInterval: 60000, // refresh once per minute
    refreshWhenHidden: true,
  });

  const currentTime = useCurrentTime();

  if (!data) return <Spinner />;

  const inside = data.filter((d) => d.type === "inside");
  const outside = data.filter((d) => d.type === "outside");

  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      <div className={styles.title}>
        <div className={styles.time}>
          <span>{format(currentTime, "HH")}</span>
          <span>:</span>
          <span>{format(currentTime, "mm")}</span>
        </div>
        <div className={styles.date}>
          {format(currentTime, "EEEE dd. MMMM yyyy", { locale: fiLocale })}
        </div>
      </div>
      <div className={styles.grid}>
        <Weather className={styles.weather} />
        <Temperature
          className={styles.temperature}
          rooms={outside}
          temperature={
            outside.reduce((acc, room) => {
              return acc + room.temperature;
            }, 0) / outside.length
          }
          title={<Icon>park</Icon>}
        />
        <Temperature
          className={styles.temperature}
          rooms={inside}
          temperature={
            inside.reduce((acc, room) => {
              return acc + room.temperature;
            }, 0) / inside.length
          }
          title={<Icon>home</Icon>}
        />
      </div>
    </>
  );
}

export default Temperatures;
