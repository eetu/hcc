import { keyframes, useTheme } from "@emotion/react";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { memo } from "react";
import useSWR from "swr";

import { api, fetcher } from "../../api";
import { SolisData } from "../../types/solis";

const flow = keyframes`
  to { stroke-dashoffset: -20; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.75; transform: scale(1.04); }
`;

const Flow: React.FC<{ className?: string }> = ({ className }) => {
  const theme = useTheme();
  const { data } = useSWR<SolisData>(api("/api/solis"), fetcher, {
    refreshInterval: 60_000,
    refreshWhenHidden: true,
    shouldRetryOnError: false,
  });

  if (!data) return null;

  const pv = data.power;
  const grid = data.grid_power ?? 0;
  const batteryPower = data.battery_power ?? 0;
  const soc = data.battery_soc;

  // Sign conventions (per backend SolisCloud):
  //   grid_power: + export, - import
  //   battery_power: + charging, - discharging
  const importing = grid < 0 ? Math.abs(grid) : 0;
  const exporting = grid > 0 ? grid : 0;
  const charging = batteryPower > 0 ? batteryPower : 0;
  const discharging = batteryPower < 0 ? Math.abs(batteryPower) : 0;
  const home = Math.max(0, pv - exporting - charging + discharging + importing);

  const hasFlow = (v: number) => Math.abs(v) > 0.05;

  const accent = theme.colors.activity.on;
  const cool = theme.colors.rain;
  const muted = theme.colors.text.muted;

  const flowStyle = {
    fill: "none",
    strokeWidth: 1.5,
    strokeDasharray: "4 6",
    animation: `${flow} 1.4s linear infinite`,
  };

  const pulseStyle = {
    transformOrigin: "center",
    transformBox: "fill-box" as const,
    animation: `${pulse} 2.4s ease-in-out infinite`,
  };

  const pvActive = hasFlow(pv);
  const homeActive = hasFlow(home);
  const batteryActive = hasFlow(batteryPower);
  const gridActive = hasFlow(grid);

  return (
    <div
      className={className}
      css={{
        backgroundColor: theme.colors.background.main,
        boxShadow: theme.shadows.main,
        borderRadius: theme.border.radius,
        padding: "1.5em",
      }}
    >
      <div
        css={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "1em",
          gap: 16,
        }}
      >
        <div
          css={{
            fontFamily: theme.fonts.heading,
            fontSize: 18,
          }}
        >
          energiavirta
        </div>
        <div
          css={{
            fontSize: 12,
            color: muted,
            whiteSpace: "nowrap",
          }}
        >
          {data.updated_at
            ? format(new Date(data.updated_at), "dd.MM.yyyy HH.mm", {
                locale: fi,
              })
            : "—"}
        </div>
      </div>
      <svg viewBox="0 0 800 420" css={{ width: "100%", height: "auto" }}>
        {/* PV → home */}
        <path
          d="M180,110 C280,110 300,210 400,210"
          stroke={accent}
          opacity={pvActive ? 1 : 0.2}
          style={flowStyle}
        />
        {/* PV → battery (charging) */}
        <path
          d="M180,110 C220,160 220,260 180,310"
          stroke={accent}
          opacity={charging > 0 ? 1 : 0.2}
          style={flowStyle}
        />
        {/* battery → home (discharging) */}
        <path
          d="M180,310 C280,310 300,210 400,210"
          stroke={cool}
          opacity={discharging > 0 ? 1 : 0.2}
          style={flowStyle}
        />
        {/* home → grid (export) or grid → home (import) */}
        <path
          d="M400,210 C500,210 520,110 620,110"
          stroke={importing > 0 ? accent : muted}
          opacity={hasFlow(grid) ? 1 : 0.2}
          style={{
            ...flowStyle,
            animationDirection: exporting > 0 ? "reverse" : "normal",
          }}
        />

        {/* PV node */}
        <g style={pvActive ? pulseStyle : undefined}>
          <circle
            cx="180"
            cy="110"
            r="36"
            fill={theme.colors.background.light}
            stroke={accent}
            strokeWidth="2"
          />
          <g stroke={accent} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="180" cy="110" r="9" fill="none" />
            <line x1="180" y1="94" x2="180" y2="98" />
            <line x1="180" y1="122" x2="180" y2="126" />
            <line x1="164" y1="110" x2="168" y2="110" />
            <line x1="192" y1="110" x2="196" y2="110" />
            <line x1="169" y1="99" x2="172" y2="102" />
            <line x1="188" y1="118" x2="191" y2="121" />
            <line x1="191" y1="99" x2="188" y2="102" />
            <line x1="172" y1="118" x2="169" y2="121" />
          </g>
        </g>
        <text
          x="180"
          y="46"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="14"
          fill={theme.colors.text.main}
        >
          aurinko
        </text>
        <text x="180" y="64" textAnchor="middle" fontSize="12" fill={muted}>
          tänään {data.today_energy.toFixed(1)} {data.today_energy_unit}
        </text>
        <text
          x="180"
          y="174"
          textAnchor="middle"
          fontSize="20"
          fill={theme.colors.text.main}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pv.toFixed(2)} kW
        </text>

        {/* Home node */}
        <g style={homeActive ? pulseStyle : undefined}>
          <circle
            cx="400"
            cy="210"
            r="36"
            fill={theme.colors.background.light}
            stroke={accent}
            strokeWidth="2"
          />
          <path
            d="M388,215 v-13 l12,-11 l12,11 v13 h-8 v-11 h-8 v11 z"
            fill="none"
            stroke={theme.colors.text.main}
            strokeWidth="1.5"
          />
        </g>
        <text
          x="400"
          y="276"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="14"
          fill={theme.colors.text.main}
        >
          koti
        </text>
        <text
          x="400"
          y="294"
          textAnchor="middle"
          fontSize="12"
          fill={muted}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {home.toFixed(2)} kW
        </text>

        {/* Battery node */}
        {soc !== null && (
          <>
            <g style={batteryActive ? pulseStyle : undefined}>
              <circle
                cx="180"
                cy="310"
                r="36"
                fill={theme.colors.background.light}
                stroke={cool}
                strokeWidth="2"
              />
              <rect
                x="168"
                y="298"
                width="22"
                height="28"
                rx="2"
                fill="none"
                stroke={theme.colors.text.main}
                strokeWidth="1.5"
              />
              <rect
                x="174"
                y="292"
                width="10"
                height="4"
                fill={theme.colors.text.main}
              />
              <rect
                x="170"
                y={326 - Math.round((soc / 100) * 26)}
                width="18"
                height={Math.round((soc / 100) * 26)}
                fill={cool}
              />
            </g>
            <text
              x="180"
              y="368"
              textAnchor="middle"
              fontFamily={theme.fonts.heading}
              fontSize="14"
              fill={theme.colors.text.main}
            >
              akku
            </text>
            <text
              x="180"
              y="386"
              textAnchor="middle"
              fontSize="12"
              fill={muted}
            >
              {Math.round(soc)}%
              {charging > 0 ? " · lataa" : discharging > 0 ? " · purkaa" : ""}
            </text>
            <text
              x="180"
              y="404"
              textAnchor="middle"
              fontSize="20"
              fill={theme.colors.text.main}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.abs(batteryPower).toFixed(2)} kW
            </text>
          </>
        )}

        {/* Grid node */}
        <g style={gridActive ? pulseStyle : undefined}>
          <circle
            cx="620"
            cy="110"
            r="36"
            fill={theme.colors.background.light}
            stroke={muted}
            strokeWidth="2"
          />
          <g stroke={theme.colors.text.main} strokeWidth="1.5" fill="none">
            <path d="M608,124 l8,-22 l4,16 l4,-12 l4,18" />
            <line x1="606" y1="124" x2="636" y2="124" />
          </g>
        </g>
        <text
          x="620"
          y="46"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="14"
          fill={theme.colors.text.main}
        >
          verkko
        </text>
        <text x="620" y="64" textAnchor="middle" fontSize="12" fill={muted}>
          {importing > 0 ? "tuonti" : exporting > 0 ? "vienti" : "lepotila"}
        </text>
        <text
          x="620"
          y="174"
          textAnchor="middle"
          fontSize="20"
          fill={theme.colors.text.main}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {Math.abs(grid).toFixed(2)} kW
        </text>
      </svg>
    </div>
  );
};

export default memo(Flow);
