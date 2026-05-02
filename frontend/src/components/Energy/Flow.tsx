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
  const cool = theme.colors.cool;
  const muted = theme.colors.text.muted;
  const idleStroke = theme.colors.text.main;

  const flowBase = {
    fill: "none",
    strokeWidth: 2,
    strokeDasharray: "4 6",
  };
  const flowAnim = { animation: `${flow} 1.4s linear infinite` };
  const flowAnimReverse = {
    animation: `${flow} 1.4s linear infinite reverse`,
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
        {/* PV → Inverter */}
        <path
          d="M160,110 C260,110 300,210 400,210"
          stroke={pvActive ? accent : idleStroke}
          opacity={pvActive ? 1 : 0.3}
          css={[flowBase, pvActive && flowAnim]}
        />
        {/* Battery ↔ Inverter (forward = discharging, reverse = charging) */}
        <path
          d="M160,310 C260,310 300,210 400,210"
          stroke={batteryActive ? cool : idleStroke}
          opacity={batteryActive ? 1 : 0.3}
          css={[
            flowBase,
            discharging > 0 && flowAnim,
            charging > 0 && flowAnimReverse,
          ]}
        />
        {/* Inverter ↔ Grid (forward = export, reverse = import) */}
        <path
          d="M400,210 C500,210 540,110 640,110"
          stroke={importing > 0 ? accent : gridActive ? accent : idleStroke}
          opacity={gridActive ? 1 : 0.3}
          css={[
            flowBase,
            exporting > 0 && flowAnim,
            importing > 0 && flowAnimReverse,
          ]}
        />
        {/* Inverter → Home */}
        <path
          d="M400,210 C500,210 540,310 640,310"
          stroke={homeActive ? accent : idleStroke}
          opacity={homeActive ? 1 : 0.3}
          css={[flowBase, homeActive && flowAnim]}
        />

        {/* PV node */}
        <g css={pvActive ? pulseStyle : undefined}>
          <circle
            cx="160"
            cy="110"
            r="36"
            fill={theme.colors.background.light}
            stroke={accent}
            strokeWidth="2"
          />
          <g stroke={accent} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="160" cy="110" r="9" fill="none" />
            <line x1="160" y1="94" x2="160" y2="98" />
            <line x1="160" y1="122" x2="160" y2="126" />
            <line x1="144" y1="110" x2="148" y2="110" />
            <line x1="172" y1="110" x2="176" y2="110" />
            <line x1="149" y1="99" x2="152" y2="102" />
            <line x1="168" y1="118" x2="171" y2="121" />
            <line x1="171" y1="99" x2="168" y2="102" />
            <line x1="152" y1="118" x2="149" y2="121" />
          </g>
        </g>
        <text
          x="160"
          y="46"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="14"
          fill={theme.colors.text.main}
        >
          aurinko
        </text>
        <text x="160" y="64" textAnchor="middle" fontSize="12" fill={muted}>
          tänään {data.today_energy.toFixed(1)} {data.today_energy_unit}
        </text>
        <text
          x="160"
          y="174"
          textAnchor="middle"
          fontSize="20"
          fill={theme.colors.text.main}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pv.toFixed(2)} kW
        </text>

        {/* Inverter node (center) */}
        <g>
          <circle
            cx="400"
            cy="210"
            r="32"
            fill={theme.colors.background.light}
            stroke={idleStroke}
            strokeWidth="2"
          />
          <rect
            x="384"
            y="194"
            width="32"
            height="32"
            rx="3"
            fill="none"
            stroke={idleStroke}
            strokeWidth="1.5"
          />
          <path
            d="M388,212 q3,-7 6,0 t6,0 t6,0"
            fill="none"
            stroke={idleStroke}
            strokeWidth="1.5"
          />
        </g>
        <text
          x="400"
          y="262"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="13"
          fill={theme.colors.text.main}
        >
          invertteri
        </text>

        {/* Battery node */}
        {soc !== null && (
          <>
            <g css={batteryActive ? pulseStyle : undefined}>
              <circle
                cx="160"
                cy="310"
                r="36"
                fill={theme.colors.background.light}
                stroke={cool}
                strokeWidth="2"
              />
              <rect
                x="148"
                y="298"
                width="22"
                height="28"
                rx="2"
                fill="none"
                stroke={theme.colors.text.main}
                strokeWidth="1.5"
              />
              <rect
                x="154"
                y="292"
                width="10"
                height="4"
                fill={theme.colors.text.main}
              />
              <rect
                x="150"
                y={326 - Math.round((soc / 100) * 26)}
                width="18"
                height={Math.round((soc / 100) * 26)}
                fill={cool}
              />
            </g>
            <text
              x="160"
              y="368"
              textAnchor="middle"
              fontFamily={theme.fonts.heading}
              fontSize="14"
              fill={theme.colors.text.main}
            >
              akku
            </text>
            <text
              x="160"
              y="386"
              textAnchor="middle"
              fontSize="12"
              fill={muted}
            >
              {Math.round(soc)}%
              {charging > 0
                ? " · lataa"
                : discharging > 0
                  ? " · purkaa"
                  : " · lepotila"}
            </text>
            <text
              x="160"
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
        <g css={gridActive ? pulseStyle : undefined}>
          <circle
            cx="640"
            cy="110"
            r="36"
            fill={theme.colors.background.light}
            stroke={muted}
            strokeWidth="2"
          />
          <g stroke={theme.colors.text.main} strokeWidth="1.5" fill="none">
            <path d="M628,124 l8,-22 l4,16 l4,-12 l4,18" />
            <line x1="626" y1="124" x2="656" y2="124" />
          </g>
        </g>
        <text
          x="640"
          y="46"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="14"
          fill={theme.colors.text.main}
        >
          verkko
        </text>
        <text x="640" y="64" textAnchor="middle" fontSize="12" fill={muted}>
          {importing > 0 ? "tuonti" : exporting > 0 ? "vienti" : "lepotila"}
        </text>
        <text
          x="640"
          y="174"
          textAnchor="middle"
          fontSize="20"
          fill={theme.colors.text.main}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {Math.abs(grid).toFixed(2)} kW
        </text>

        {/* Home node */}
        <g css={homeActive ? pulseStyle : undefined}>
          <circle
            cx="640"
            cy="310"
            r="36"
            fill={theme.colors.background.light}
            stroke={accent}
            strokeWidth="2"
          />
          <path
            d="M628,315 v-13 l12,-11 l12,11 v13 h-8 v-11 h-8 v11 z"
            fill="none"
            stroke={theme.colors.text.main}
            strokeWidth="1.5"
          />
        </g>
        <text
          x="640"
          y="368"
          textAnchor="middle"
          fontFamily={theme.fonts.heading}
          fontSize="14"
          fill={theme.colors.text.main}
        >
          koti
        </text>
        <text
          x="640"
          y="386"
          textAnchor="middle"
          fontSize="12"
          fill={muted}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {home.toFixed(2)} kW
        </text>
      </svg>
    </div>
  );
};

export default memo(Flow);
