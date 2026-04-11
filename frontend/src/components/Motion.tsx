import { useTheme } from "@emotion/react";
import { formatDistanceToNow } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { FC } from "react";

import { Sensor } from "../types/hue";

type MotionProps = {
  className?: string;
  sensors?: Sensor[];
  error?: boolean;
};

const Motion: FC<MotionProps> = ({ className, sensors = [], error }) => {
  const theme = useTheme();
  const motionSensors = sensors.filter((s) => s.motion !== undefined);

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
      {motionSensors.map((s) => (
        <div
          key={s.id}
          css={{
            display: "table-row",
            backgroundColor: s.motion
              ? theme.colors.activity.onBackground
              : "transparent",
          }}
        >
          <span
            css={{
              display: "table-cell",
              padding: "8px 4px",
              verticalAlign: "middle",
            }}
          >
            <span css={{ fontWeight: s.motion ? "bold" : "normal" }}>
              {s.name}
            </span>
          </span>
          <span
            css={{
              display: "table-cell",
              padding: "8px 4px",
              verticalAlign: "middle",
              color: s.motion
                ? theme.colors.activity.on
                : theme.colors.text.muted,
              fontWeight: s.motion ? "bold" : "normal",
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            {s.motion ? "liikettä" : "ei liikettä"}
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
            {s.motionUpdatedAt
              ? formatDistanceToNow(new Date(s.motionUpdatedAt), {
                  addSuffix: true,
                  locale: fi,
                })
              : "—"}
          </span>
        </div>
      ))}
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

export default Motion;
