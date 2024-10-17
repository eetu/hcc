import { useTheme } from "@emotion/react";
import { FC, useCallback, useEffect, useState } from "react";

import { Group } from "../pages/api/hue";
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
        paddingRight: "calc(1em + 30px)",
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
    if (group.state.on !== isOn) {
      setIsOn(group.state.on);
    }
  }, [group.state.on, isOn]);

  const handleClick = useCallback(
    (id: string, isOn: boolean) => () => {
      fetch(`/api/hue/toggleGroup/${id}`, { method: "POST" }).then((res) => {
        if (res.status === 200) {
          setIsOn(!isOn);
        }
      });
    },
    []
  );

  const theme = useTheme();

  return (
    <button
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        color:
          theme.mode === "dark"
            ? isOn
              ? theme.colors.text.light
              : theme.colors.text.main
            : theme.colors.text.main,
        padding: "5px 2px",
        cursor: "pointer",
        width: 148,
        borderRadius: 5,
        border: `3px solid ${isOn ? "#f78f08" : theme.colors.text.main}`,
        background: isOn
          ? "linear-gradient(153deg, rgba(255,237,207,1) 0%, rgba(255,239,171,1) 56%)"
          : theme.mode === "dark"
            ? "#404040"
            : "#d9d9d9",
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
          flexGrow: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {group.name}
      </span>
    </button>
  );
};
