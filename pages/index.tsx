import { css } from "@emotion/react";
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

const breakpoints = [600];

const mq = breakpoints.map((bp) => `@media (max-width: ${bp}px)`);

const Main: NextPage<MainProps> = (props) => {
  const { imageTag } = props;

  const theme = useTheme();

  useEffect(() => {
    document.querySelector("body")?.setAttribute("data-theme", theme);
  }, [theme]);

  const temperatureCss = css({
    gridRow: 2,
    [mq[0]]: {
      padding: "1em",
      width: "100%",
    },
  });

  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      {imageTag && (
        <Tooltip
          css={{
            position: "absolute",
            top: "8px",
            right: "8px",
            whiteSpace: "nowrap",
          }}
          content={<span>build:&nbsp;{imageTag}</span>}
        >
          <Icon
            css={{
              opacity: 0.5,
            }}
          >
            info
          </Icon>
        </Tooltip>
      )}
      <CurrentTime
        css={{
          marginTop: "2em",
          [mq[0]]: {
            fontSize: "12px",
          },
        }}
      />
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          marginTop: "1em",
          gap: 20,
          [mq[0]]: {
            display: "flex",
            flexDirection: "column",
            marginTop: "1em",
            alignItems: "center",
          },
        }}
      >
        <Weather
          css={{
            gridColumn: "1 / span 3",
            gridRow: 1,
          }}
        />
        <Temperature css={temperatureCss} type="outside" title="ulkona" />
        <Temperature css={temperatureCss} type="inside" title="sisällä" />
        <Temperature css={temperatureCss} type="inside_cold" title="kuisti" />
      </div>
    </>
  );
};

export default Main;
