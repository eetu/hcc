import { useTheme } from "@emotion/react";
import { formatDistanceToNow } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { FC, memo, useState } from "react";

import { api } from "../api";
import { Sensor } from "../types/hue";
import Icon from "./Icon";

type MotionProps = {
  className?: string;
  sensors?: Sensor[];
  error?: boolean;
};

const Motion: FC<MotionProps> = ({ className, sensors = [], error }) => {
  const theme = useTheme();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const motionSensors = sensors.filter(
    (s) => s.motion !== undefined || s.motionEnabled !== undefined,
  );

  const toggle = async (deviceId: string) => {
    if (pending.has(deviceId)) return;
    setPending((p) => new Set(p).add(deviceId));
    try {
      await fetch(api(`/api/hue/toggleMotion/${deviceId}`), { method: "POST" });
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(deviceId);
        return next;
      });
    }
  };

  return (
    <div
      className={className}
      css={{
        display: "table",
        width: "100%",
        fontSize: 16,
        color: error ? theme.colors.error : theme.colors.text.main,
        backgroundColor: theme.colors.background.main,
        boxShadow: theme.shadows.main,
        borderRadius: 6,
        padding: "1.5em",
      }}
    >
      {motionSensors.map((s) => {
        const enabled = s.motionEnabled !== false;
        const active = enabled && s.motion;
        return (
          <div
            key={s.id}
            css={{
              display: "table-row",
              backgroundColor: active
                ? theme.colors.activity.onBackground
                : "transparent",
              opacity: enabled ? 1 : 0.5,
            }}
          >
            <span
              css={{
                display: "table-cell",
                padding: "8px 4px",
                verticalAlign: "middle",
                width: 32,
              }}
            >
              <button
                onClick={() => toggle(s.deviceId)}
                disabled={pending.has(s.deviceId)}
                aria-label={
                  enabled ? "Poista liiketunnistin käytöstä" : "Ota käyttöön"
                }
                css={{
                  cursor: pending.has(s.deviceId) ? "wait" : "pointer",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: enabled
                    ? theme.colors.text.main
                    : theme.colors.text.muted,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icon size={20}>{enabled ? "sensors" : "sensors_off"}</Icon>
              </button>
            </span>
            <span
              css={{
                display: "table-cell",
                padding: "8px 4px",
                verticalAlign: "middle",
              }}
            >
              <span css={{ fontWeight: active ? "bold" : "normal" }}>
                {s.name}
              </span>
            </span>
            <span
              css={{
                display: "table-cell",
                padding: "8px 4px",
                verticalAlign: "middle",
                color: active
                  ? theme.colors.activity.on
                  : theme.colors.text.muted,
                fontWeight: active ? "bold" : "normal",
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {!enabled
                ? "pois käytöstä"
                : s.motion
                  ? "liikettä"
                  : "ei liikettä"}
            </span>
            <span
              css={{
                display: "table-cell",
                padding: "8px 4px",
                verticalAlign: "middle",
                color: theme.colors.text.muted,
                fontSize: 13,
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {enabled && s.motionUpdatedAt
                ? formatDistanceToNow(new Date(s.motionUpdatedAt), {
                    addSuffix: true,
                    locale: fi,
                  })
                : "—"}
            </span>
          </div>
        );
      })}
      {motionSensors.length === 0 && (
        <div css={{ display: "table-row" }}>
          <span
            css={{
              display: "table-cell",
              color: theme.colors.text.muted,
              padding: "8px 4px",
            }}
          >
            Ei liiketunnistimia
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(Motion);
