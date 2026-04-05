import { useTheme } from "@emotion/react";
import { formatDistanceToNow } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { FC } from "react";

import { Sensor } from "../pages/api/hue";

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
        borderCollapse: "collapse",
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
            <span
              css={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: s.connected
                  ? theme.colors.connected
                  : theme.colors.disconnected,
                marginRight: 8,
                verticalAlign: "middle",
                flexShrink: 0,
              }}
              title={s.connected ? "Yhdistetty" : "Yhteysvirhe"}
            />
            <span css={{ fontWeight: s.motion ? "bold" : "normal" }}>
              {s.name}
            </span>
          </span>
          <span
            css={{
              display: "table-cell",
              padding: "8px 4px",
              verticalAlign: "middle",
              color: s.motion ? theme.colors.activity.on : theme.colors.text.light,
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
              color: theme.colors.text.light,
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
              color: theme.colors.text.light,
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
