import { useTheme } from "@emotion/react";
import { FC, useCallback, useEffect, useState } from "react";

import { api } from "../api";
import { mq } from "../mq";
import { Group } from "../types/hue";
import Icon from "./Icon";

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
        gap: 5,
        flexWrap: "wrap",
        borderRadius: 5,
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

export default LightGroups;

type LightGroupProps = {
  group: Group;
};

const LightGroup: FC<LightGroupProps> = ({ group }) => {
  const [isOn, setIsOn] = useState(group.state.on);

  useEffect(() => {
    setIsOn(group.state.on);
  }, [group.state.on]);

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
        gap: 5,
        [mq[0]]: {
          gap: 10,
        },
        color: theme.colors.text.main,
        padding: "5px 2px",
        cursor: "pointer",
        width: 148,
        borderRadius: 5,
        [mq[0]]: {
          width: "100%",
        },
        border: `3px solid ${isOn ? theme.colors.activity.on : theme.colors.text.main}`,
        background: isOn
          ? theme.colors.activity.onBackground
          : theme.colors.activity.offBackground,
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
            ? "rgba(247, 143, 8, 0.15)"
            : "rgba(0,0,0, 0.15)",
          height: 42,
          width: 42,
        }}
      >
        <Icon
          css={{ color: isOn ? "#f8a63a" : theme.colors.text.main }}
          size={36}
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
        }}
      >
        {group.name}
      </span>
    </button>
  );
};
