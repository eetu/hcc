import { css, useTheme } from "@emotion/react";
import { useState } from "react";

import { api } from "../../api";
import type {
  ConnectResponse,
  DiscoveredBridge,
  PairResponse,
} from "../../types/migrate";

type Props = {
  onNext: () => void;
};

const ConnectStep = ({ onNext }: Props) => {
  const theme = useTheme();
  const [bridges, setBridges] = useState<DiscoveredBridge[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [oldBridge, setOldBridge] = useState<DiscoveredBridge | null>(null);
  const [newBridge, setNewBridge] = useState<DiscoveredBridge | null>(null);
  const [oldApiKey, setOldApiKey] = useState("");
  const [newCredentials, setNewCredentials] = useState<PairResponse | null>(
    null,
  );
  const [pairing, setPairing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState<ConnectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const res = await fetch(api("/api/migrate/discover"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed");
      setBridges(data.bridges);
      if (data.bridges.length === 0) {
        setError("No bridges found on the network");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const handlePairNew = async () => {
    if (!newBridge) return;
    setPairing(true);
    setError(null);
    try {
      const res = await fetch(api("/api/hue/pair"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bridgeIp: newBridge.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pairing failed");
      setNewCredentials(data as PairResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pairing failed");
    } finally {
      setPairing(false);
    }
  };

  const handleConnect = async () => {
    if (!oldBridge || !oldApiKey || !newCredentials) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(api("/api/migrate/connect"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldHub: { address: oldBridge.address, apiKey: oldApiKey },
          newHub: {
            address: newCredentials.HUE_BRIDGE_ADDRESS,
            apiKey: newCredentials.HUE_BRIDGE_USER,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      setConnected(data as ConnectResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const inputCss = css({
    padding: "10px 14px",
    fontSize: "1em",
    border: `1px solid ${theme.colors.text.muted}`,
    borderRadius: 6,
    backgroundColor: "transparent",
    color: theme.colors.text.main,
    width: "100%",
    maxWidth: 300,
  });

  const btnCss = css({
    padding: "12px 24px",
    fontSize: "1em",
    cursor: "pointer",
    backgroundColor: theme.colors.text.main,
    color: theme.colors.body,
    border: "none",
    borderRadius: 6,
    "&:disabled": { opacity: 0.6, cursor: "wait" },
  });

  const outlineBtnCss = css({
    padding: "10px 16px",
    fontSize: "1em",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: `1px solid ${theme.colors.text.muted}`,
    borderRadius: 6,
    color: theme.colors.text.main,
    "&:disabled": { opacity: 0.6, cursor: "wait" },
  });

  const sectionCss = css({
    padding: "1em",
    marginBottom: "1em",
    border: `1px solid ${theme.colors.text.muted}30`,
    borderRadius: 6,
  });

  return (
    <div>
      <h2 css={{ margin: "0 0 0.5em" }}>Step 2: Connect Both Hubs</h2>
      <p css={{ color: theme.colors.text.muted, margin: "0 0 1.5em" }}>
        Discover your bridges, pair with the new hub, then connect to both.
      </p>

      {/* Discover or manual entry */}
      <div css={sectionCss}>
        <h3 css={{ margin: "0 0 0.75em", fontSize: "1em" }}>
          Find Bridges
        </h3>
        <div css={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            css={outlineBtnCss}
          >
            {discovering ? "Discovering..." : "Auto-Discover"}
          </button>
          <span css={{ color: theme.colors.text.muted, fontSize: "0.9em" }}>
            or enter IPs manually below
          </span>
        </div>

        {bridges.length > 0 && (
          <div
            css={{
              marginTop: "1em",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {bridges.map((b) => (
              <div
                key={b.id}
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.text.muted}40`,
                  borderRadius: 6,
                  fontFamily: "monospace",
                  fontSize: "0.9em",
                }}
              >
                <span css={{ flex: 1 }}>
                  {b.address}:{b.port}
                  <span css={{ color: theme.colors.text.muted, marginLeft: 8 }}>
                    ({b.id})
                  </span>
                </span>
                <button
                  onClick={() => setOldBridge(b)}
                  css={css(outlineBtnCss, {
                    padding: "4px 10px",
                    fontSize: "0.85em",
                    backgroundColor:
                      oldBridge?.id === b.id
                        ? theme.colors.text.main
                        : "transparent",
                    color:
                      oldBridge?.id === b.id
                        ? theme.colors.body
                        : theme.colors.text.main,
                  })}
                >
                  {oldBridge?.id === b.id ? "Old" : "Set Old"}
                </button>
                <button
                  onClick={() => setNewBridge(b)}
                  css={css(outlineBtnCss, {
                    padding: "4px 10px",
                    fontSize: "0.85em",
                    backgroundColor:
                      newBridge?.id === b.id
                        ? theme.colors.text.main
                        : "transparent",
                    color:
                      newBridge?.id === b.id
                        ? theme.colors.body
                        : theme.colors.text.main,
                  })}
                >
                  {newBridge?.id === b.id ? "New" : "Set New"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Manual IP entry */}
        <div css={{ marginTop: "1em", display: "flex", flexDirection: "column", gap: 10 }}>
          <div css={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label css={{ minWidth: 70, fontSize: "0.9em" }}>Old hub:</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.40"
              value={oldBridge?.address ?? ""}
              onChange={(e) =>
                setOldBridge({ id: "manual-old", address: e.target.value, port: 443 })
              }
              css={inputCss}
            />
          </div>
          <div css={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label css={{ minWidth: 70, fontSize: "0.9em" }}>New hub:</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.50"
              value={newBridge?.address ?? ""}
              onChange={(e) =>
                setNewBridge({ id: "manual-new", address: e.target.value, port: 443 })
              }
              css={inputCss}
            />
          </div>
        </div>
      </div>

      {/* Pair new hub */}
      {newBridge && !newCredentials && (
        <div css={sectionCss}>
          <h3 css={{ margin: "0 0 0.75em", fontSize: "1em" }}>
            Pair with New Hub ({newBridge.address})
          </h3>
          <p css={{ color: theme.colors.text.muted, margin: "0 0 1em" }}>
            Press the link button on the new hub, then click Pair.
          </p>
          <button onClick={handlePairNew} disabled={pairing} css={btnCss}>
            {pairing ? "Pairing..." : "Pair"}
          </button>
        </div>
      )}

      {/* New hub credentials */}
      {newCredentials && (
        <div css={sectionCss}>
          <h3 css={{ margin: "0 0 0.75em", fontSize: "1em" }}>
            New Hub Paired
          </h3>
          <p css={{ margin: "0 0 1em", color: theme.colors.text.muted }}>
            Save these for your .env file after migration:
          </p>
          <div
            css={{
              fontFamily: "monospace",
              fontSize: "0.85em",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div>HUE_BRIDGE_ADDRESS={newCredentials.HUE_BRIDGE_ADDRESS}</div>
            <div>HUE_BRIDGE_USER={newCredentials.HUE_BRIDGE_USER}</div>
            <div>
              HUE_BRIDGE_USER_CLIENT_KEY=
              {newCredentials.HUE_BRIDGE_USER_CLIENT_KEY}
            </div>
          </div>
        </div>
      )}

      {/* Old hub API key */}
      {oldBridge && newCredentials && (
        <div css={sectionCss}>
          <h3 css={{ margin: "0 0 0.75em", fontSize: "1em" }}>
            Old Hub API Key ({oldBridge.address})
          </h3>
          <p css={{ color: theme.colors.text.muted, margin: "0 0 1em" }}>
            Enter the API key for your old hub (HUE_BRIDGE_USER from your
            current .env).
          </p>
          <div css={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Old hub API key"
              value={oldApiKey}
              onChange={(e) => setOldApiKey(e.target.value)}
              css={inputCss}
            />
          </div>
        </div>
      )}

      {error && <p css={{ color: "#e74c3c", marginTop: "1em" }}>{error}</p>}

      {/* Connect button */}
      {oldBridge && oldApiKey && newCredentials && !connected && (
        <button onClick={handleConnect} disabled={connecting} css={btnCss}>
          {connecting ? "Connecting..." : "Connect to Both Hubs"}
        </button>
      )}

      {/* Connected success */}
      {connected && (
        <div
          css={{
            marginTop: "1em",
            padding: "1em",
            backgroundColor: "#27ae6015",
            border: "1px solid #27ae60",
            borderRadius: 6,
          }}
        >
          <p css={{ margin: "0 0 0.5em", fontWeight: 600 }}>
            Connected to both hubs!
          </p>
          <div
            css={{
              fontSize: "0.9em",
              color: theme.colors.text.muted,
              marginBottom: "1em",
            }}
          >
            Old: {connected.oldBridgeId} &middot; New: {connected.newBridgeId}
          </div>
          <button onClick={onNext} css={btnCss}>
            Next: Export Old Hub
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectStep;
