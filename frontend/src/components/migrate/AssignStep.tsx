import { css, useTheme } from "@emotion/react";
import { useCallback, useEffect, useState } from "react";

import { api } from "../../api";
import type {
  MigrationSnapshot,
  MigrationStatus,
  NewHubDevice,
  SnapshotDevice,
} from "../../types/migrate";
import DeviceCard from "./DeviceCard";

const AssignStep = () => {
  const theme = useTheme();
  const [snapshot, setSnapshot] = useState<MigrationSnapshot | null>(null);
  const [newDevices, setNewDevices] = useState<NewHubDevice[]>([]);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [selectedOld, setSelectedOld] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [snapshotRes, devicesRes, statusRes] = await Promise.all([
      fetch(api("/api/migrate/snapshot")),
      fetch(api("/api/migrate/devices")),
      fetch(api("/api/migrate/status")),
    ]);
    if (snapshotRes.ok) setSnapshot(await snapshotRes.json());
    if (devicesRes.ok) setNewDevices(await devicesRes.json());
    if (statusRes.ok) setStatus(await statusRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMoveDevice = async (oldDeviceId: string) => {
    setMoving(oldDeviceId);
    setError(null);
    try {
      const res = await fetch(api("/api/migrate/move-device"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldDeviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Move failed");
      // Auto-select this device for assignment
      setSelectedOld(oldDeviceId);
      // If search was started, wait a moment then refresh devices
      if (data.searchStarted) {
        setSearching(true);
        setTimeout(async () => {
          await fetchData();
          setSearching(false);
        }, 10000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Move failed");
    } finally {
      setMoving(null);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setError(null);
    try {
      await fetch(api("/api/migrate/search"), { method: "POST" });
      // Wait for devices to pair, then refresh
      setTimeout(async () => {
        await fetchData();
        setSearching(false);
      }, 10000);
    } catch {
      setSearching(false);
    }
  };

  const handleIdentify = async (deviceId: string) => {
    await fetch(api(`/api/migrate/identify/${deviceId}`), { method: "POST" });
  };

  const handleAssign = async (newDeviceId: string) => {
    if (!selectedOld) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api("/api/migrate/assign"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldDeviceId: selectedOld,
          newDeviceId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Assignment failed");
      }
      setSelectedOld(null);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (oldDeviceId: string) => {
    await fetch(api("/api/migrate/unassign"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldDeviceId }),
    });
    await fetchData();
  };

  if (!snapshot || !status) {
    return <p>Loading...</p>;
  }

  const assignments = status.assignments;
  const reverseAssignments = Object.fromEntries(
    Object.entries(assignments).map(([k, v]) => [v, k]),
  );

  const assignedCount = Object.keys(assignments).length;
  const totalDevices = snapshot.devices.length;
  const progress = totalDevices > 0 ? (assignedCount / totalDevices) * 100 : 0;

  // Group old devices by room
  const roomMap = new Map(snapshot.rooms.map((r) => [r.id, r.name]));
  const devicesByRoom = new Map<string, SnapshotDevice[]>();
  for (const device of snapshot.devices) {
    const roomName = device.roomId
      ? (roomMap.get(device.roomId) ?? "Unknown")
      : "No Room";
    const list = devicesByRoom.get(roomName) ?? [];
    list.push(device);
    devicesByRoom.set(roomName, list);
  }

  // Unassigned new devices
  const unassignedNew = newDevices.filter((d) => !reverseAssignments[d.id]);

  // Get selected old device for match hints
  const selectedOldDevice = snapshot.devices.find((d) => d.id === selectedOld);

  const outlineBtnCss = css({
    padding: "4px 12px",
    fontSize: "0.85em",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: `1px solid ${theme.colors.text.muted}`,
    borderRadius: 4,
    color: theme.colors.text.main,
  });

  return (
    <div>
      <h2 css={{ margin: "0 0 0.5em" }}>Step 5: Assign Devices</h2>
      <p css={{ color: theme.colors.text.muted, margin: "0 0 0.5em" }}>
        Move devices from old hub to new hub, then assign their old identities.
      </p>
      <p
        css={{
          color: theme.colors.text.muted,
          margin: "0 0 1em",
          fontSize: "0.9em",
        }}
      >
        <strong>Workflow:</strong> Click &quot;Move&quot; on an old device to
        delete it from the old hub and start pairing search on the new hub. Wait
        for it to appear on the right, flash to identify, then click to assign.
      </p>

      {/* Progress bar */}
      <div
        css={{
          marginBottom: "1.5em",
          padding: "0.75em 1em",
          backgroundColor: theme.colors.background.main,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          css={{
            flex: 1,
            height: 8,
            backgroundColor: `${theme.colors.text.muted}30`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            css={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#27ae60",
              borderRadius: 4,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span
          css={{ fontSize: "0.9em", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          {assignedCount} / {totalDevices}
        </span>
        <button onClick={fetchData} css={outlineBtnCss}>
          Refresh
        </button>
        <button
          onClick={handleSearch}
          disabled={searching}
          css={css(outlineBtnCss, {
            opacity: searching ? 0.6 : 1,
          })}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p css={{ color: "#e74c3c", marginBottom: "1em" }}>{error}</p>}

      {/* Two-column layout */}
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          "@media (max-width: 700px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        {/* Left: Old devices by room */}
        <div>
          <h3 css={{ margin: "0 0 0.75em", fontSize: "1em" }}>
            Old Hub Devices
          </h3>
          {[...devicesByRoom.entries()].map(([roomName, devices]) => (
            <div key={roomName} css={{ marginBottom: "1em" }}>
              <div
                css={{
                  fontSize: "0.85em",
                  fontWeight: 600,
                  color: theme.colors.text.muted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {roomName}
              </div>
              <div css={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {devices.map((device) => {
                  const isAssigned = !!assignments[device.id];
                  const assignedNewId = assignments[device.id];
                  const assignedNewDevice = assignedNewId
                    ? newDevices.find((d) => d.id === assignedNewId)
                    : null;
                  const isMoving = moving === device.id;

                  return (
                    <DeviceCard
                      key={device.id}
                      name={device.name}
                      productName={device.productName}
                      serviceTypes={device.serviceTypes}
                      selected={selectedOld === device.id}
                      assigned={isAssigned}
                      assignedTo={assignedNewDevice?.name}
                      onClick={() => {
                        if (isAssigned) {
                          handleUnassign(device.id);
                        } else {
                          setSelectedOld(
                            selectedOld === device.id ? null : device.id,
                          );
                        }
                      }}
                      onMove={
                        !isAssigned && !isMoving
                          ? () => handleMoveDevice(device.id)
                          : undefined
                      }
                      moveLabel={isMoving ? "Moving..." : "Move"}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: New hub devices */}
        <div>
          <h3 css={{ margin: "0 0 0.75em", fontSize: "1em" }}>
            New Hub Devices
            {selectedOld && (
              <span
                css={{
                  fontWeight: 400,
                  fontSize: "0.85em",
                  color: theme.colors.text.muted,
                  marginLeft: 8,
                }}
              >
                — click to assign
              </span>
            )}
          </h3>
          {searching && (
            <p
              css={{
                color: theme.colors.text.muted,
                fontSize: "0.9em",
                marginBottom: "0.5em",
              }}
            >
              Searching for new devices...
            </p>
          )}
          <div css={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {unassignedNew.length === 0 && !searching && (
              <p css={{ color: theme.colors.text.muted, fontSize: "0.9em" }}>
                No unassigned devices. Move a device from the old hub or click
                Search to scan.
              </p>
            )}
            {unassignedNew.map((device) => {
              const isMatchHint =
                selectedOldDevice &&
                device.modelId &&
                selectedOldDevice.modelId === device.modelId;

              return (
                <DeviceCard
                  key={device.id}
                  name={device.name}
                  productName={device.productName}
                  serviceTypes={device.serviceTypes}
                  matchHint={!!isMatchHint}
                  onClick={
                    selectedOld && !loading
                      ? () => handleAssign(device.id)
                      : undefined
                  }
                  onIdentify={() => handleIdentify(device.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStep;
