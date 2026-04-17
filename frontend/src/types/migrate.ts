export type MigrationSnapshot = {
  exportedAt: string;
  rooms: SnapshotRoom[];
  devices: SnapshotDevice[];
  zones: SnapshotZone[];
  scenes: SnapshotScene[];
};

export type SnapshotRoom = {
  id: string;
  name: string;
  archetype?: string;
  deviceIds: string[];
};

export type SnapshotDevice = {
  id: string;
  name: string;
  productName?: string;
  modelId?: string;
  roomId?: string;
  serviceTypes: string[];
};

export type SnapshotZone = {
  id: string;
  name: string;
  deviceIds: string[];
};

export type SnapshotScene = {
  id: string;
  name: string;
  roomId: string;
  actions: unknown;
};

export type NewHubDevice = {
  id: string;
  name: string;
  productName?: string;
  modelId?: string;
  serviceTypes: string[];
  lightId?: string;
};

export type MigrationStatus = {
  connected: boolean;
  hasSnapshot: boolean;
  deviceCount: number;
  assignedCount: number;
  assignments: Record<string, string>;
  roomsCreated: Record<string, string>;
};

export type RoomCreated = {
  oldName: string;
  oldId: string;
  newId: string;
};

export type PairResponse = {
  message: string;
  HUE_BRIDGE_ADDRESS: string;
  HUE_BRIDGE_USER: string;
  HUE_BRIDGE_USER_CLIENT_KEY: string;
};

export type DiscoveredBridge = {
  id: string;
  address: string;
  port: number;
};

export type ConnectResponse = {
  connected: boolean;
  oldBridgeId: string;
  newBridgeId: string;
};
