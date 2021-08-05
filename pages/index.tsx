//export const config = { amp: true };
import useSWR from "swr";
import { Room } from "./api/temperatures";
import styles from "../styles/temperatures.module.css";
import Temperature from "../components/temperature";
import Head from "next/head";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Temperatures(props: any) {
  const { data, error } = useSWR<Room[]>("/api/temperatures", fetcher);

  if (!data) return <div className={styles.spinner}>...loading</div>;

  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      <div className={styles.grid}>
        {data.map((room) => (
          <Temperature key={room.id} room={room} />
        ))}
      </div>
    </>
  );
}

export default Temperatures;
