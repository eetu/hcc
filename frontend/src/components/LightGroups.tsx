import { keyframes, useTheme } from "@emotion/react";
import { FC, memo, useCallback, useState } from "react";

import { api } from "../api";
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
        display: "flex",
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        borderRadius: theme.border.radius,
        [mq[0]]: {
          flexDirection: "column",
        },
      }}
    >
      {groups.map((g) => (
        <LightGroup key={g.id} group={g}></LightGroup>
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
    (id: string, isOn: boolean) => () => {
      fetch(api(`/api/hue/toggleGroup/${id}`), { method: "POST" }).then(
        (res) => {
          if (res.status === 200) {
            setIsOn(!isOn);
          }
        },
      );
    },
    [],
  );

  const theme = useTheme();

  return (
    <button
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        [mq[0]]: {
          gap: 10,
          width: "100%",
        },
        color: theme.colors.text.main,
        padding: "5px 12px 5px 4px",
        cursor: "pointer",
        width: 175,
        borderRadius: theme.border.radius,
        border: `3px solid ${isOn ? theme.colors.activity.on : theme.colors.text.main}`,
        background: isOn
          ? theme.colors.activity.onBackground
          : theme.colors.background.light,
        transition: "background 0.4s ease, border-color 0.3s ease",
      }}
      onClick={handleClick(group.id, isOn)}
    >
      <div
        css={{
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
            color: isOn ? theme.colors.activity.on : theme.colors.text.muted,
            animation: isOn ? `${bulbGlow} 3.2s ease-in-out infinite` : "none",
            transition: "color 0.3s ease",
          }}
          size={32}
          type="normal"
        >
          lightbulb
        </Icon>
      </div>
      <span
        css={{
          fontSize: 14,
          [mq[0]]: {
            fontSize: 18,
          },
          overflow: "hidden",
          textOverflow: "ellipsis",
          textTransform: "lowercase",
        }}
      >
        {group.name}
      </span>
    </button>
  );
};
