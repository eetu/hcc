export type Sensor = {
  id: string;
  deviceId: string;
  name: string;
  temperature?: number;
  type: "inside" | "inside_cold" | "outside";
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

export type HueLiveEvent =
  | { type: "grouped_light"; id: string; on: boolean }
  | { type: "temperature"; id: string; temperature: number }
  | { type: "device_power"; deviceId: string; battery: number }
  | { type: "motion"; deviceId: string; motion: boolean; updatedAt: string }
  | { type: "connectivity"; deviceId: string; connected: boolean };
