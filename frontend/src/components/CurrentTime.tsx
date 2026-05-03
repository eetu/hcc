import { useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import React, { memo } from "react";

import useCurrentTime from "../hooks/useCurrentTime";
import useLocal from "../hooks/useLocal";

type CurrentTimeProps = {} & React.HTMLAttributes<HTMLDivElement>;

const DISPLAY_FONTS = [
  {
    family: '"DM Serif Display", Georgia, serif',
    weight: 400,
    tracking: "-0.02em",
  },
  {
    family: '"Abril Fatface", Georgia, serif',
    weight: 400,
    tracking: "-0.02em",
  },
  {
    family: '"Instrument Serif", Georgia, serif',
    weight: 400,
    tracking: "-0.02em",
  },
  { family: '"Inter", system-ui, sans-serif', weight: 300, tracking: "-0.1em" },
];

const CurrentTime: React.FC<CurrentTimeProps> = ({ className }) => {
  const theme = useTheme();
  const currentTime = useCurrentTime();
  const [fontIndex, setFontIndex] = useLocal("clockFontIndex", 0);
  const displayFont = DISPLAY_FONTS[fontIndex] ?? DISPLAY_FONTS[0];

  const hh = format(currentTime, "HH");
  const mm = format(currentTime, "mm");
  const ss = format(currentTime, "ss");

  const cycleFont = () => setFontIndex((i) => (i + 1) % DISPLAY_FONTS.length);

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
        onClick={cycleFont}
        css={{
          fontFamily: displayFont.family,
          fontSize: "7em",
          lineHeight: 1,
          fontWeight: displayFont.weight,
          letterSpacing: displayFont.tracking,
          fontVariantNumeric: "tabular-nums",
          display: "flex",
          alignItems: "baseline",
          gap: "0.05em",
          cursor: "pointer",
          userSelect: "none",
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
            letterSpacing: "normal",
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
