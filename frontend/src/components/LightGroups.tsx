import { keyframes, useTheme } from "@emotion/react";
import { FC, memo, useCallback, useState } from "react";

import { api } from "../api";
import useScreenshotMode, { anonymize } from "../hooks/useScreenshotMode";
import { mq } from "../mq";
import { Group } from "../types/hue";
import Icon from "./Icon";

const bulbGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 4px rgba(247, 143, 8, 0.55)); }
  50%      { filter: drop-shadow(0 0 10px rgba(247, 143, 8, 0.85)); }
`;

type LightGroupsProps = {
  groups: Group[];
} & React.HTMLAttributes<HTMLDivElement>;

const LightGroups: FC<LightGroupsProps> = ({ groups, className }) => {
  const theme = useTheme();

  return (
    <div
      className={className}
      css={{
        backgroundColor: theme.colors.background.main,
        boxShadow: theme.shadows.main,
        padding: "1em",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        borderRadius: theme.border.radius,
        [mq[0]]: {
          gridTemplateColumns: "1fr",
        },
      }}
    >
      {groups.map((g) => (
        <LightGroup key={g.id} group={g} />
      ))}
    </div>
  );
};

export default memo(LightGroups);

type LightGroupProps = {
  group: Group;
};

const LightGroup: FC<LightGroupProps> = ({ group }) => {
  const [isOn, setIsOn] = useState(group.state.on);
  const [prevOn, setPrevOn] = useState(group.state.on);

  if (prevOn !== group.state.on) {
    setPrevOn(group.state.on);
    setIsOn(group.state.on);
  }

  const handleClick = useCallback(
    (id: string, on: boolean) => () => {
      fetch(api(`/api/hue/toggleGroup/${id}`), { method: "POST" }).then(
        (res) => {
          if (res.status === 200) {
            setIsOn(!on);
          }
        },
      );
    },
    [],
  );

  const theme = useTheme();
  const demo = useScreenshotMode();
  const accent = theme.colors.activity.on;
  const muted = theme.colors.text.muted;

  return (
    <button
      onClick={handleClick(group.id, isOn)}
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        color: theme.colors.text.main,
        padding: "8px 16px 8px 6px",
        cursor: "pointer",
        width: "100%",
        borderRadius: theme.border.radius,
        border: `3px solid ${isOn ? accent : theme.colors.text.main}`,
        background: isOn
          ? theme.colors.activity.onBackground
          : theme.colors.background.light,
        transition: "background 0.4s ease, border-color 0.3s ease",
        textAlign: "left",
      }}
    >
      <div
        css={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "100%",
          backgroundColor: isOn
            ? "rgba(247, 143, 8, 0.18)"
            : "rgba(0, 0, 0, 0.06)",
          height: 42,
          width: 42,
          transition: "background 0.4s ease",
        }}
      >
        <Icon
          css={{
            color: isOn ? accent : muted,
            animation: isOn ? `${bulbGlow} 3.2s ease-in-out infinite` : "none",
            transition: "color 0.3s ease",
          }}
          size={32}
          type="normal"
        >
          lightbulb
        </Icon>
      </div>
      <div
        css={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          css={{
            fontSize: 16,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textTransform: "lowercase",
          }}
        >
          {demo ? anonymize(group.id, "ryhmä") : group.name}
        </span>
      </div>
    </button>
  );
};
