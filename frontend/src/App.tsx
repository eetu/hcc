import { css, useTheme } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";

import { api } from "./api";
import CurrentTime from "./components/CurrentTime";
import FmiWeatherBox from "./components/FmiWeatherBox";
import History from "./components/History";
import Icon from "./components/Icon";
import LightGroups from "./components/LightGroups";
import LocationForm from "./components/LocationForm";
import Motion from "./components/Motion";
import SolisBox from "./components/SolisBox";
import TemperatureBox from "./components/TemperatureBox";
import { mq } from "./mq";
import { type HueLiveEvent, type Response, type Sensor } from "./types/hue";

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

type View = "temperature" | "lights" | "motion" | "history" | "settings";

const VIEWS: { id: View; icon: string }[] = [
  { id: "temperature", icon: "thermostat" },
  { id: "lights", icon: "lightbulb" },
  { id: "motion", icon: "directions_run" },
  { id: "history", icon: "timeline" },
  { id: "settings", icon: "settings" },
];

const App = () => {
  const [data, setData] = useState<Response | undefined>(undefined);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View>("temperature");
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const syncData = () => {
      fetch(api("/api/hue"))
        .then((r) => r.json())
        .then((d: Response) => {
          setData(d);
          setError(false);
        })
        .catch(() => setError(true));
    };

    const es = new EventSource(api("/api/hue/events"));
    es.onopen = syncData;
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

  const sensors = data?.sensors;
  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);

  const { inside, outside, insideCold } = useMemo(() => {
    const empty: Sensor[] = [];
    if (!sensors) return { inside: empty, outside: empty, insideCold: empty };
    return sensors.reduce(
      (acc, s) => {
        if (s.type === "inside_cold") acc.insideCold = acc.insideCold.concat(s);
        else acc[s.type] = acc[s.type].concat(s);
        return acc;
      },
      { inside: empty, outside: empty, insideCold: empty },
    );
  }, [sensors]);

  const outsideTemp = Math.min(
    ...outside
      .map((s) => s.temperature)
      .filter((t): t is number => t !== undefined),
  );

  const theme = useTheme();

  return (
    <>
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
          width: 720,
          flexShrink: 0,
          [mq[0]]: {
            width: "100%",
            flexShrink: 1,
            padding: "0 12px",
            boxSizing: "border-box",
          },
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
            marginTop: "1em",
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
                  color:
                    view === id
                      ? theme.colors.text.main
                      : theme.colors.text.muted,
                  padding: "4px 6px",
                  transition: "color 0.15s, border-color 0.15s",
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
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              alignItems: "start",
              gap: 20,
              [mq[0]]: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                width: "100%",
              },
            }}
          >
            {view === "temperature" && (
              <>
                <FmiWeatherBox css={{ gridColumn: "1 / span 4", gridRow: 1 }} />
                <TemperatureBox
                  css={temperatureCss}
                  sensors={outside}
                  title="ulkona"
                  error={error}
                  temperatureOverride={outsideTemp}
                />
                <TemperatureBox
                  css={temperatureCss}
                  sensors={inside}
                  title="sisällä"
                  error={error}
                />
                <TemperatureBox
                  css={temperatureCss}
                  sensors={insideCold}
                  title="kuisti"
                  error={error}
                />
                <SolisBox css={temperatureCss} />
              </>
            )}

            {view === "lights" && (
              <LightGroups css={{ gridColumn: "1 / span 4" }} groups={groups} />
            )}

            {view === "motion" && (
              <Motion
                css={{ gridColumn: "1 / span 4" }}
                sensors={outside.concat(insideCold).concat(inside)}
                error={!!error}
              />
            )}

            {view === "history" && (
              <History css={{ gridColumn: "1 / span 4" }} />
            )}

            {view === "settings" && (
              <div
                css={{
                  gridColumn: "1 / span 4",
                  backgroundColor: theme.colors.background.main,
                  boxShadow: theme.shadows.main,
                  borderRadius: theme.border.radius,
                  padding: "1.5em",
                  minHeight: 250,
                }}
              >
                <LocationForm css={{ marginBottom: "1.5em" }} />
                <div
                  css={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "0.5em",
                    color: theme.colors.text.main,
                    ...theme.typography.caption,
                  }}
                >
                  <Icon css={{ opacity: 1 }} size={16}>
                    local_offer
                  </Icon>
                  {import.meta.env.VITE_HCC_IMAGE_TAG}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
