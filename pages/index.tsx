import { css, useTheme } from "@emotion/react";
import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { GetServerSidePropsContext, NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import useSWR from "swr";

import CurrentTime from "../components/CurrentTime";
import Icon from "../components/Icon";
import LightGroups from "../components/LightGroups";
import Temperature from "../components/Temperature";
import TomorrowWeather from "../components/TomorrowWeather";
import Tooltip from "../components/Tooltip";
import { Response, Sensor } from "./api/hue";

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

export const mq = breakpoints.map((bp) => `@media (max-width: ${bp}px)`);

const Main: NextPage<MainProps> = ({ imageTag }) => {
  const { data, error } = useSWR<Response>("/api/hue", fetcher, {
    refreshInterval: 2000, // refresh once per second
    refreshWhenHidden: true,
  });

  const [showLights, setShowLights] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const temperatureCss = css({
    gridRow: 2,
  });

  const sensors = data?.sensors ?? [];
  const emptySensorsArray: Sensor[] = [];

  const {
    inside,
    outside,
    inside_cold: insideCold,
  } = sensors.reduce(
    (acc, s) => {
      acc[s.type] = acc[s.type].concat(s);
      return acc;
    },
    {
      inside: emptySensorsArray,
      outside: emptySensorsArray,
      inside_cold: emptySensorsArray,
    }
  );

  const groups = data?.groups ?? [];

  const theme = useTheme();
  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
      {imageTag && (
        <Tooltip
          css={{
            position: "absolute",
            bottom: "8px",
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
      <button
        css={{
          position: "absolute",
          top: "8px",
          right: "8px",
          cursor: "pointer",
          backgroundColor: "transparent",
          border: "none",
          color: theme.colors.text.main,
        }}
        onClick={toggleFullscreen}
      >
        <Icon>{!fullscreen ? "fullscreen" : "fullscreen_exit"}</Icon>
      </button>
      <div>
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
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            marginTop: "1em",
            gap: 20,
            maxWidth: 520,
            [mq[0]]: {
              display: "flex",
              flexDirection: "column",
              marginTop: "1em",
              alignItems: "center",
            },
          }}
        >
          {groups.length > 0 && (
            <button
              css={{
                position: "absolute",
                right: 5,
                top: 5,
                cursor: "pointer",
                backgroundColor: "transparent",
                border: "none",
                color: theme.colors.text.main,
              }}
              onClick={() => setShowLights(!showLights)}
            >
              <Icon size={32}>{showLights ? "thermostat" : "lightbulb"}</Icon>
            </button>
          )}
          {!showLights ? (
            <>
              <TomorrowWeather
                css={{
                  gridColumn: "1 / span 3",
                  gridRow: 1,
                }}
              />
              <Temperature
                css={temperatureCss}
                sensors={outside}
                title="ulkona"
                error={error}
              />
              <Temperature
                css={temperatureCss}
                sensors={inside}
                title="sisällä"
                error={error}
              />
              <Temperature
                css={temperatureCss}
                sensors={insideCold}
                title="kuisti"
                error={error}
              />
            </>
          ) : (
            <LightGroups
              css={{
                gridColumn: "1 / span 3",
              }}
              groups={groups}
            ></LightGroups>
          )}
        </div>
      </div>
    </>
  );
};

export default Main;
