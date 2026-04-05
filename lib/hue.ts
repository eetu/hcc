import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { Agent, fetch, type RequestInit } from "undici";

import { readCache, writeCache } from "./file-cache";

dotenv.config();

const env = cleanEnv(process.env, {
  HUE_BRIDGE_ADDRESS: str({ default: "" }),
  HUE_BRIDGE_USER: str({ default: "" }),
  // Maps types to arrays of room names:
  // {"inside": ["Keittiö", "Makuuhuone"], "outside": ["Ulkona"], "inside_cold": ["Varasto"]}
  HUE_ROOM_TYPES: str({ default: "{}" }),
});

// Hue bridge uses a self-signed certificate — disable verification for local requests
const tlsAgent = new Agent({ connect: { rejectUnauthorized: false } });

const fetchJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, { dispatcher: tlsAgent, ...options });
  if (!res.ok)
    throw new Error(`${url} responded ${res.status}: ${await res.text()}`);
  return res.json() as T; // single unavoidable cast at the JSON boundary
};

type RoomType = "inside" | "inside_cold" | "outside";

const BRIDGE_CACHE_FILE = "/tmp/hue-bridge-address";

let discoveredBridgeAddress: string | null = null;
let discoveryPromise: Promise<string> | null = null;

const getBridgeAddress = async (): Promise<string> => {
  if (env.HUE_BRIDGE_ADDRESS) return env.HUE_BRIDGE_ADDRESS;
  if (discoveredBridgeAddress) return discoveredBridgeAddress;

  // Check file cache before hitting the network (survives HMR reloads)
  const cached = readCache(BRIDGE_CACHE_FILE, 60 * 60 * 1000); // 1 hour TTL
  if (cached) {
    discoveredBridgeAddress = cached;
    return cached;
  }

  // Deduplicate concurrent requests
  if (!discoveryPromise) {
    discoveryPromise = (async () => {
      const bridges = await fetchJson<{ internalipaddress: string }[]>(
        "https://discovery.meethue.com/",
      );
      const bridge = bridges.find((b) => b.internalipaddress);
      if (!bridge) throw new Error("No Hue bridge found on network");

      console.log(`Discovered Hue bridge at ${bridge.internalipaddress}`);
      discoveredBridgeAddress = bridge.internalipaddress;
      writeCache(BRIDGE_CACHE_FILE, bridge.internalipaddress);
      return bridge.internalipaddress;
    })().finally(() => {
      discoveryPromise = null;
    });
  }

  return discoveryPromise;
};

const buildRoomTypeMap = (): Map<string, RoomType> => {
  const map = new Map<string, RoomType>();
  try {
    const config = JSON.parse(env.HUE_ROOM_TYPES) as Partial<
      Record<RoomType, string[]>
    >;
    for (const [type, rooms] of Object.entries(config) as [
      RoomType,
      string[],
    ][]) {
      for (const room of rooms) {
        map.set(room, type);
      }
    }
  } catch {
    // empty map — all rooms default to "inside"
  }
  return map;
};

const hueFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  if (!env.HUE_BRIDGE_USER) {
    throw new Error("HUE_BRIDGE_USER must be set. Run pairing first.");
  }

  const address = await getBridgeAddress();
  return fetchJson<T>(`https://${address}${path}`, {
    ...options,
    headers: {
      "hue-application-key": env.HUE_BRIDGE_USER,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
};

// ---- Minimal CLIP v2 resource shapes ----

interface HueList<T> {
  data: T[];
  errors: unknown[];
}

interface RoomResource {
  id: string;
  metadata: { name: string };
  children: { rid: string; rtype: string }[];
  services: { rid: string; rtype: string }[];
  type: "room";
}

interface TemperatureResource {
  id: string;
  id_v1: string;
  owner: { rid: string; rtype: "device" };
  enabled: boolean;
  temperature: {
    temperature: number;
    temperature_valid: boolean;
    temperature_report?: { temperature: number; changed: string };
  };
  type: "temperature";
}

interface GroupedLightResource {
  id: string;
  id_v1?: string;
  owner: { rid: string; rtype: "room" | "zone" | "bridge_home" };
  on: { on: boolean };
  type: "grouped_light";
}

interface DeviceResource {
  id: string;
  metadata: { name: string };
  type: "device";
}

interface DevicePowerResource {
  id: string;
  owner: { rid: string; rtype: "device" };
  power_state: { battery_level?: number };
  type: "device_power";
}

interface MotionResource {
  id: string;
  owner: { rid: string; rtype: "device" };
  enabled: boolean;
  motion: {
    motion: boolean;
    motion_valid: boolean;
    motion_report?: { changed: string; motion: boolean };
  };
  type: "motion";
}

interface ZigbeeConnectivityResource {
  id: string;
  owner: { rid: string; rtype: "device" };
  status: "connected" | "disconnected" | "connectivity_issue" | "unidirectional_incoming";
  type: "zigbee_connectivity";
}

// ---- Public response types (same shape as /api/hue) ----

export type Sensor = {
  id: string;         // temperature resource UUID
  deviceId: string;   // device UUID — used for matching motion/power/connectivity events
  name: string;
  temperature?: number;
  type: RoomType;
  enabled: boolean;
  battery?: number;
  motion?: boolean;
  motionUpdatedAt?: string;
  connected: boolean;
};

export type Group = {
  id: string;
  name: string;
  state: { on: boolean };
};

export type Response = {
  sensors: Sensor[];
  groups: Group[];
};

// ---- Data functions ----

const DATA_CACHE_TTL = 10_000; // 10 seconds — absorbs HMR reconnect bursts; SSE keeps UI live

// Anchored to `global` so the cache survives Next.js module re-evaluation during HMR.
// Without this, saving any file resets the module-level variables and every reconnecting
// EventSource triggers a fresh 7-request burst to the bridge.
declare global {
  var _hueDataCache: { data: Response; timestamp: number } | null | undefined;
  var _hueDataFetchPromise: Promise<Response> | null | undefined;
}
global._hueDataCache ??= null;
global._hueDataFetchPromise ??= null;

export const getHueData = async (): Promise<Response> => {
  if (
    global._hueDataCache &&
    Date.now() - global._hueDataCache.timestamp < DATA_CACHE_TTL
  ) {
    return global._hueDataCache.data;
  }

  if (global._hueDataFetchPromise) return global._hueDataFetchPromise;

  global._hueDataFetchPromise = fetchHueData()
    .then((data) => {
      global._hueDataCache = { data, timestamp: Date.now() };
      return data;
    })
    .finally(() => {
      global._hueDataFetchPromise = null;
    });

  return global._hueDataFetchPromise;
};

const fetchHueData = async (): Promise<Response> => {
  const roomTypeMap = buildRoomTypeMap();

  const [roomsRes, tempsRes, groupedLightsRes, devicePowersRes, devicesRes, motionRes, connectivityRes] =
    await Promise.all([
      hueFetch<HueList<RoomResource>>("/clip/v2/resource/room"),
      hueFetch<HueList<TemperatureResource>>("/clip/v2/resource/temperature"),
      hueFetch<HueList<GroupedLightResource>>("/clip/v2/resource/grouped_light"),
      hueFetch<HueList<DevicePowerResource>>("/clip/v2/resource/device_power"),
      hueFetch<HueList<DeviceResource>>("/clip/v2/resource/device"),
      hueFetch<HueList<MotionResource>>("/clip/v2/resource/motion"),
      hueFetch<HueList<ZigbeeConnectivityResource>>("/clip/v2/resource/zigbee_connectivity"),
    ]);

  // device ID → battery level
  const batteryByDevice = new Map<string, number>();
  for (const dp of devicePowersRes.data) {
    if (dp.power_state.battery_level !== undefined) {
      batteryByDevice.set(dp.owner.rid, dp.power_state.battery_level);
    }
  }

  // device ID → room (via room children)
  const roomByDevice = new Map<string, RoomResource>();
  for (const room of roomsRes.data) {
    for (const child of room.children) {
      if (child.rtype === "device") {
        roomByDevice.set(child.rid, room);
      }
    }
  }

  const deviceNameById = new Map(devicesRes.data.map((d) => [d.id, d.metadata.name]));

  const motionByDevice = new Map(
    motionRes.data.map((m) => [
      m.owner.rid,
      {
        motion: m.motion.motion_report?.motion ?? m.motion.motion,
        updatedAt: m.motion.motion_report?.changed,
      },
    ]),
  );

  const connectedByDevice = new Map(
    connectivityRes.data.map((c) => [c.owner.rid, c.status === "connected"]),
  );

  const sensors: Sensor[] = tempsRes.data.map((temp) => {
    const room = roomByDevice.get(temp.owner.rid);
    const roomName = room?.metadata.name;
    const name = deviceNameById.get(temp.owner.rid) ?? roomName ?? temp.id;
    const type: RoomType = roomTypeMap.get(roomName ?? "") ?? "inside";
    const temperature =
      temp.temperature.temperature_report?.temperature ??
      temp.temperature.temperature;
    const battery = batteryByDevice.get(temp.owner.rid);
    const motionData = motionByDevice.get(temp.owner.rid);

    return {
      id: temp.id,
      deviceId: temp.owner.rid,
      name,
      temperature,
      type,
      enabled: temp.enabled,
      battery,
      motion: motionData?.motion,
      motionUpdatedAt: motionData?.updatedAt,
      connected: connectedByDevice.get(temp.owner.rid) ?? true,
    };
  });

  const roomById = new Map(roomsRes.data.map((r) => [r.id, r]));

  const groups: Group[] = groupedLightsRes.data
    .filter((gl) => gl.owner.rtype === "room")
    .map((gl) => ({
      id: gl.id,
      name: roomById.get(gl.owner.rid)?.metadata.name ?? gl.id,
      state: { on: gl.on.on },
    }));

  return { sensors, groups };
};

export const toggleGroup = async (groupId: string): Promise<void> => {
  const res = await hueFetch<HueList<GroupedLightResource>>(
    `/clip/v2/resource/grouped_light/${groupId}`,
  );
  const current = res.data[0];
  await hueFetch(`/clip/v2/resource/grouped_light/${groupId}`, {
    method: "PUT",
    body: JSON.stringify({ on: { on: !current.on.on } }),
  });
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    await hueFetch("/clip/v2/resource/bridge");
    return true;
  } catch {
    return false;
  }
};

// ---- Pairing ----

export const pairWithBridge = async (
  bridgeIp?: string,
): Promise<{ address: string; username: string; clientkey: string }> => {
  const address = bridgeIp ?? (await getBridgeAddress());
  const data = await fetchJson<
    Array<{
      success?: { username: string; clientkey: string };
      error?: { type: number; description: string };
    }>
  >(`https://${address}/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ devicetype: "hcc#server", generateclientkey: true }),
  });

  const entry = data[0];
  if (entry.error) {
    throw new Error(entry.error.description);
  }
  return { address, ...entry.success! };
};
