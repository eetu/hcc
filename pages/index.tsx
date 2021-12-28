//export const config = { amp: true };
import Head from "next/head";

import CurrentTime from "../components/currentTime";
import Icon from "../components/icon";
import Temperature from "../components/temperature";
import Weather from "../components/weather";
import styles from "../styles/temperatures.module.css";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Temperatures(_props: any) {
  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      <CurrentTime className={styles.title}></CurrentTime>
      <div className={styles.grid}>
        <Weather className={styles.weather} />
        <Temperature
          className={styles.temperature}
          type="outside"
          title={<Icon size="big">park</Icon>}
        />
        <Temperature
          className={styles.temperature}
          type="inside"
          title={<Icon size="big">home</Icon>}
        />
        <Temperature
          className={styles.temperature}
          type="inside_cold"
          title={<Icon size="big">door_back</Icon>}
        />
      </div>
    </>
  );
}

export default Temperatures;
