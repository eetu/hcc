//export const config = { amp: true };
import { format } from "date-fns";
import fiLocale from "date-fns/locale/fi";
import Head from "next/head";

import Icon from "../components/icon";
import Temperature from "../components/temperature";
import useCurrentTime from "../components/useCurrentTime";
import Weather from "../components/weather";
import styles from "../styles/temperatures.module.css";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Temperatures(_props: any) {
  const currentTime = useCurrentTime();

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
          type="outside"
          title={<Icon>park</Icon>}
        />
        <Temperature
          className={styles.temperature}
          type="inside"
          title={<Icon>home</Icon>}
        />
      </div>
    </>
  );
}

export default Temperatures;
