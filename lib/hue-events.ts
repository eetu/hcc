import { type Agent, fetch } from "undici";

import { getConnectionInfo } from "./hue";

export type HueLiveEvent =
  | { type: "grouped_light"; id: string; on: boolean }
  | { type: "temperature"; id: string; temperature: number }
  | { type: "device_power"; deviceId: string; battery: number }
  | { type: "motion"; deviceId: string; motion: boolean; updatedAt: string }
  | { type: "connectivity"; deviceId: string; connected: boolean };

type Subscriber = (event: HueLiveEvent) => void;

const subscribers = new Set<Subscriber>();
let streamLoop: Promise<void> | null = null;

const broadcast = (event: HueLiveEvent) => {
  for (const sub of subscribers) sub(event);
};

const parseResourceUpdate = (resource: Record<string, unknown>): HueLiveEvent | null => {
  switch (resource.type) {
    case "grouped_light": {
      const on = (resource.on as { on: boolean } | undefined)?.on;
      if (on !== undefined) return { type: "grouped_light", id: resource.id as string, on };
      return null;
    }
    case "temperature": {
      const temp = resource.temperature as { temperature: number; temperature_report?: { temperature: number } } | undefined;
      const value = temp?.temperature_report?.temperature ?? temp?.temperature;
      if (value !== undefined) return { type: "temperature", id: resource.id as string, temperature: value };
      return null;
    }
    case "device_power": {
      const level = (resource.power_state as { battery_level?: number } | undefined)?.battery_level;
      if (level !== undefined)
        return { type: "device_power", deviceId: (resource.owner as { rid: string }).rid, battery: level };
      return null;
    }
    case "motion": {
      const report = (resource.motion as { motion_report?: { motion: boolean; changed: string } } | undefined)?.motion_report;
      if (report)
        return {
          type: "motion",
          deviceId: (resource.owner as { rid: string }).rid,
          motion: report.motion,
          updatedAt: report.changed,
        };
      return null;
    }
    case "zigbee_connectivity": {
      const status = resource.status as string | undefined;
      if (status !== undefined)
        return {
          type: "connectivity",
          deviceId: (resource.owner as { rid: string }).rid,
          connected: status === "connected",
        };
      return null;
    }
    default:
      return null;
  }
};

const runStreamLoop = async () => {
  while (true) {
    try {
      const { address, user, agent } = await getConnectionInfo();

      const response = await fetch(`https://${address}/eventstream/clip/v2`, {
        headers: { "hue-application-key": user, Accept: "text/event-stream" },
        dispatcher: agent as Agent,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Event stream responded ${response.status}`);
      }

      console.log("Hue event stream connected");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const envelopes = JSON.parse(line.slice(5).trim()) as Array<{
              type: string;
              data: Array<Record<string, unknown>>;
            }>;
            for (const envelope of envelopes) {
              if (envelope.type !== "update") continue;
              for (const resource of envelope.data) {
                const event = parseResourceUpdate(resource);
                if (event) broadcast(event);
              }
            }
          } catch {
            // malformed event — skip
          }
        }
      }
    } catch (err) {
      console.error("Hue event stream disconnected, reconnecting in 5s:", err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export const subscribeToHueEvents = (callback: Subscriber): (() => void) => {
  subscribers.add(callback);

  if (!streamLoop) {
    streamLoop = runStreamLoop();
  }

  return () => {
    subscribers.delete(callback);
  };
};
