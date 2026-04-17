import { css, useTheme } from "@emotion/react";
import { useEffect, useRef, useState } from "react";

import { api } from "../../api";
import type { MigrationSnapshot } from "../../types/migrate";

type Props = {
  onNext: () => void;
};

type Summary = {
  rooms: number;
  devices: number;
  zones: number;
  scenes: number;
};

const ExportStep = ({ onNext }: Props) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check if a snapshot already exists in the session
  useEffect(() => {
    fetch(api("/api/migrate/snapshot")).then((res) => {
      if (res.ok) {
        res.json().then((snap: MigrationSnapshot) => {
          setHasSession(true);
          setSummary({
            rooms: snap.rooms.length,
            devices: snap.devices.length,
            zones: snap.zones.length,
            scenes: snap.scenes.length,
          });
        });
      } else {
        setHasSession(false);
      }
    });
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api("/api/migrate/export"));
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Export failed");
      }

      const snapshot: MigrationSnapshot = await res.json();
      setSummary({
        rooms: snapshot.rooms.length,
        devices: snapshot.devices.length,
        zones: snapshot.zones.length,
        scenes: snapshot.scenes.length,
      });

      // Download as backup
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hue-hub-snapshot.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);

      const res = await fetch(api("/api/migrate/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }

      const data: Summary = await res.json();
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

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
    padding: "12px 24px",
    fontSize: "1em",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: `1px solid ${theme.colors.text.muted}`,
    borderRadius: 6,
    color: theme.colors.text.main,
    "&:disabled": { opacity: 0.6, cursor: "wait" },
  });

  return (
    <div>
      <h2 css={{ margin: "0 0 0.5em" }}>Step 3: Export Old Hub</h2>
      <p css={{ color: theme.colors.text.muted, margin: "0 0 1.5em" }}>
        Export the old hub&apos;s configuration (rooms, devices, scenes). The
        snapshot is stored in memory and also downloaded as a backup file.
      </p>

      <div css={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleExport} disabled={loading} css={btnCss}>
          {loading ? "Exporting..." : "Export Old Hub"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          css={{ display: "none" }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          css={outlineBtnCss}
        >
          {importing ? "Importing..." : "Restore from Backup"}
        </button>
        {hasSession === false && !summary && (
          <span css={{ color: theme.colors.text.muted, fontSize: "0.85em" }}>
            Session lost? Upload a previously exported backup file.
          </span>
        )}
      </div>

      {error && <p css={{ color: "#e74c3c", marginTop: "1em" }}>{error}</p>}

      {summary && (
        <div
          css={{
            marginTop: "1.5em",
            padding: "1em",
            backgroundColor: theme.colors.background.main,
            borderRadius: 6,
          }}
        >
          <p css={{ margin: "0 0 0.5em", fontWeight: 600 }}>
            Snapshot ready
          </p>
          <ul css={{ margin: 0, paddingLeft: "1.5em" }}>
            <li>{summary.rooms} rooms</li>
            <li>{summary.devices} devices</li>
            <li>{summary.zones} zones</li>
            <li>{summary.scenes} scenes</li>
          </ul>
          <button
            onClick={onNext}
            css={css({
              marginTop: "1em",
              padding: "10px 20px",
              fontSize: "1em",
              cursor: "pointer",
              backgroundColor: theme.colors.text.main,
              color: theme.colors.body,
              border: "none",
              borderRadius: 6,
            })}
          >
            Next: Create Rooms
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportStep;
