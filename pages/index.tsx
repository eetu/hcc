import { css, useTheme } from "@emotion/react";
import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { GetServerSidePropsContext, NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import CurrentTime from "../components/CurrentTime";
import Icon from "../components/Icon";
import LightGroups from "../components/LightGroups";
import Motion from "../components/Motion";
import Temperature from "../components/Temperature";
import TomorrowWeather from "../components/TomorrowWeather";
import Tooltip from "../components/Tooltip";
import { type HueLiveEvent } from "../lib/hue-events";
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

type View = "temperature" | "lights" | "motion" | "settings";

const VIEWS: { id: View; icon: string }[] = [
  { id: "temperature", icon: "thermostat" },
  { id: "lights", icon: "lightbulb" },
  { id: "motion", icon: "directions_run" },
  { id: "settings", icon: "settings" },
];

const applyEvent = (data: Response, event: HueLiveEvent): Response => {
  switch (event.type) {
    case "grouped_light":
      return {
        ...data,
        groups: data.groups.map((g) =>
          g.id === event.id ? { ...g, state: { on: event.on } } : g,
        ),
      };
    case "temperature":
      return {
        ...data,
        sensors: data.sensors.map((s) =>
          s.id === event.id ? { ...s, temperature: event.temperature } : s,
        ),
      };
    case "device_power":
      return {
        ...data,
        sensors: data.sensors.map((s) =>
          s.deviceId === event.deviceId ? { ...s, battery: event.battery } : s,
        ),
      };
    case "motion":
      return {
        ...data,
        sensors: data.sensors.map((s) =>
          s.deviceId === event.deviceId
            ? { ...s, motion: event.motion, motionUpdatedAt: event.updatedAt }
            : s,
        ),
      };
    case "connectivity":
      return {
        ...data,
        sensors: data.sensors.map((s) =>
          s.deviceId === event.deviceId
            ? { ...s, connected: event.connected }
            : s,
        ),
      };
  }
};

const Main: NextPage<MainProps> = ({ imageTag }) => {
  const [data, setData] = useState<Response | undefined>(undefined);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View>("temperature");
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const syncData = () => {
      fetch("/api/hue")
        .then((r) => r.json())
        .then((d: Response) => {
          setData(d);
          setError(false);
        })
        .catch(() => setError(true));
    };

    const es = new EventSource("/api/hue/events");
    es.onopen = syncData; // full sync on connect and every reconnect
    es.onmessage = (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as HueLiveEvent;
      setData((prev) => (prev ? applyEvent(prev, event) : prev));
    };
    return () => es.close();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const temperatureCss = css({ gridRow: 2 });

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
    },
  );

  const groups = data?.groups ?? [];

  const theme = useTheme();

  return (
    <>
      <Head>
        <title>Hue Control Center</title>
      </Head>
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
      <div
        css={{
          width: 580,
          flexShrink: 0,
          [mq[0]]: { width: "100%", flexShrink: 1 },
        }}
      >
        <CurrentTime
          css={{
            marginTop: "2em",
            [mq[0]]: { fontSize: "12px" },
          }}
        />
        <div
          css={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            width: "100%",
            [mq[0]]: { flexDirection: "column" },
          }}
        >
          <div
            css={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              width: 48,
              flexShrink: 0,
              paddingTop: "0.5em",
              [mq[0]]: {
                flexDirection: "row",
                width: "auto",
                paddingTop: 0,
                paddingBottom: "0.25em",
              },
            }}
          >
            {VIEWS.map(({ id, icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                css={{
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  border: "none",
                  borderLeft:
                    view === id
                      ? `2px solid ${theme.colors.text.main}`
                      : "2px solid transparent",
                  borderBottom: "2px solid transparent",
                  color:
                    view === id
                      ? theme.colors.text.main
                      : theme.colors.text.muted,
                  padding: "4px 6px",
                  transition: "color 0.15s, border-color 0.15s",
                  [mq[0]]: {
                    borderLeft: "2px solid transparent",
                    borderBottom:
                      view === id
                        ? `2px solid ${theme.colors.text.main}`
                        : "2px solid transparent",
                    padding: "4px 10px",
                  },
                }}
              >
                <Icon size={28}>{icon}</Icon>
              </button>
            ))}
          </div>

          <div
            css={{
              flex: 1,
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 20,
              [mq[0]]: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
              },
            }}
          >
            {view === "temperature" && (
              <>
                <TomorrowWeather
                  css={{ gridColumn: "1 / span 3", gridRow: 1 }}
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
            )}

            {view === "lights" && (
              <LightGroups css={{ gridColumn: "1 / span 3" }} groups={groups} />
            )}

            {view === "motion" && (
              <Motion
                css={{ gridColumn: "1 / span 3" }}
                sensors={outside.concat(insideCold).concat(inside)}
                error={!!error}
              />
            )}

            {view === "settings" && (
              <div
                css={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Icon css={{ opacity: 1 }} size={16}>
                  local_offer
                </Icon>
                &nbsp;
                <span>{imageTag}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;
