import { css, useTheme } from "@emotion/react";
import { useState } from "react";

import { api } from "../../api";
import type { RoomCreated } from "../../types/migrate";

type Props = {
  onNext: () => void;
};

const RoomsStep = ({ onNext }: Props) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<RoomCreated[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api("/api/migrate/create-rooms"), {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create rooms");
      }
      const data: RoomCreated[] = await res.json();
      setCreated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create rooms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 css={{ margin: "0 0 0.5em" }}>Step 4: Create Rooms on New Hub</h2>
      <p css={{ color: theme.colors.text.muted, margin: "0 0 1.5em" }}>
        Create rooms on the new hub matching your old hub&apos;s room structure.
      </p>

      {!created && (
        <button
          onClick={handleCreateRooms}
          disabled={loading}
          css={css({
            padding: "12px 24px",
            fontSize: "1em",
            cursor: loading ? "wait" : "pointer",
            backgroundColor: theme.colors.text.main,
            color: theme.colors.body,
            border: "none",
            borderRadius: 6,
            opacity: loading ? 0.6 : 1,
          })}
        >
          {loading ? "Creating rooms..." : "Create Rooms"}
        </button>
      )}

      {error && <p css={{ color: "#e74c3c", marginTop: "1em" }}>{error}</p>}

      {created && (
        <div
          css={{
            marginTop: "1em",
            padding: "1em",
            backgroundColor: theme.colors.background.main,
            borderRadius: 6,
          }}
        >
          <p css={{ margin: "0 0 0.5em", fontWeight: 600 }}>
            {created.length} rooms created
          </p>
          <ul css={{ margin: 0, paddingLeft: "1.5em" }}>
            {created.map((r) => (
              <li key={r.newId}>{r.oldName}</li>
            ))}
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
            Next: Assign Devices
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomsStep;
