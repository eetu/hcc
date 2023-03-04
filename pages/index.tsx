//export const config = { amp: true };
import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { GetServerSidePropsContext, NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";

import CurrentTime from "../components/CurrentTime";
import Icon from "../components/Icon";
import Temperature from "../components/Temperature";
import Tooltip from "../components/Tooltip";
import useTheme from "../components/useTheme";
import Weather from "../components/Weather";
import styles from "../styles/main.module.css";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const getServerSideProps = async (_ctx: GetServerSidePropsContext) => {
  dotenv.config();
  const env = cleanEnv(process.env, {
    HCC_IMAGE_TAG: str({ default: undefined }),
  });

  return {
    props: { imageTag: env.HCC_IMAGE_TAG ?? null },
  };
};

type MainProps = {
  imageTag?: string;
};

const Main: NextPage<MainProps> = (props) => {
  const { imageTag } = props;

  const theme = useTheme();

  useEffect(() => {
    document.querySelector("body")?.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      {imageTag && (
        <span className={styles.buildTag}>
          <Tooltip content={<div>build:&nbsp;{imageTag}</div>}>
            <Icon className={styles.buildTagIcon}>info</Icon>
          </Tooltip>
        </span>
      )}
      <CurrentTime className={styles.title}></CurrentTime>
      <div className={styles.grid}>
        <Weather className={styles.weather} />
        <Temperature
          className={styles.temperature}
          type="outside"
          title="ulkona"
        />
        <Temperature
          className={styles.temperature}
          type="inside"
          title="sisällä"
        />
        <Temperature
          className={styles.temperature}
          type="inside_cold"
          title="kuisti"
        />
      </div>
    </>
  );
};

export default Main;
