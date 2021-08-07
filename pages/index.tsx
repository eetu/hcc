//export const config = { amp: true };
import useSWR from "swr";
import { Room } from "./api/temperatures";
import styles from "../styles/temperatures.module.css";
import Temperature from "../components/temperature";
import Head from "next/head";
import Icon from "../components/icon";
import Spinner from "../components/spinner";
import Weather from "../components/weather";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Temperatures(props: any) {
  const { data, error } = useSWR<Room[]>("/api/temperatures", fetcher, {
    refreshInterval: 60000, // refresh once per minute
    refreshWhenHidden: true,
  });

  if (!data) return <Spinner />;

  const inside = data.filter((d) => d.type === "inside");
  const outside = data.filter((d) => d.type === "outside");

  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      <div className={styles.grid}>
        <Temperature
          rooms={outside}
          temperature={
            outside.reduce((acc, room) => {
              return acc + room.temperature;
            }, 0) / outside.length
          }
          title={<Icon>wb_sunny</Icon>}
        />
        <Temperature
          rooms={inside}
          temperature={
            inside.reduce((acc, room) => {
              return acc + room.temperature;
            }, 0) / inside.length
          }
          title={<Icon>cottage</Icon>}
        />
        <Weather></Weather>
      </div>
    </>
  );
}

export default Temperatures;
