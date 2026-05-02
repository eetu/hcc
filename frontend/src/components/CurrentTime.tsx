import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import React, { memo } from "react";

import useCurrentTime from "../hooks/useCurrentTime";

type CurrentTimeProps = {} & React.HTMLAttributes<HTMLDivElement>;

const CurrentTime: React.FC<CurrentTimeProps> = ({ className }) => {
  const theme = useTheme();
  const currentTime = useCurrentTime();

  const hh = format(currentTime, "HH");
  const mm = format(currentTime, "mm");
  const ss = format(currentTime, "ss");

  return (
    <div
      className={className}
      css={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        css={{
          fontSize: "7em",
          lineHeight: 1,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          display: "flex",
          alignItems: "baseline",
          gap: "0.05em",
        }}
      >
        <span>{hh}</span>
        <span css={{ color: theme.colors.activity.on }}>.</span>
        <span>{mm}</span>
        <span
          css={{
            fontFamily: theme.fonts.heading,
            fontSize: "0.22em",
            fontWeight: 400,
            color: theme.colors.text.muted,
            marginLeft: "0.4em",
            marginBottom: "0.6em",
            alignSelf: "flex-end",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {ss}
        </span>
      </div>
      <div
        css={{
          fontFamily: theme.fonts.heading,
          fontSize: "1.1em",
          fontWeight: 400,
          marginTop: 6,
          color: theme.colors.text.muted,
          textTransform: "capitalize",
        }}
      >
        {format(currentTime, "EEEE dd. MMMM yyyy", { locale: fi })}
      </div>
    </div>
  );
};
export default memo(CurrentTime);
