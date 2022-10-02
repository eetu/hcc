//export const config = { amp: true };
import "tippy.js/dist/tippy.css"; // optional

import Tippy from "@tippyjs/react";
import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { GetServerSidePropsContext, NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import CurrentTime from "../components/CurrentTime";
import Icon from "../components/Icon";
import Temperature from "../components/Temperature";
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
        <Tippy content={<div>build: {imageTag}</div>}>
          <span className={styles.buildTag}>
            <Icon>info</Icon>
          </span>
        </Tippy>
      )}
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
};

export default Main;
