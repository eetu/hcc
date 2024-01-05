import { useTheme } from "@emotion/react";
import { FC, useCallback, useState } from "react";

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
  const [innerState, setInnerState] = useState(group.state.on);

  const handleClick = useCallback(
    (id: string) => () => {
      fetch(`/api/hue/toggleGroup/${id}`, { method: "POST" }).then((res) => {
        if (res.status === 200) {
          setInnerState(!innerState);
        }
      });
    },
    [innerState]
  );

  const theme = useTheme();

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        color:
          theme.mode === "dark"
            ? group.state.on
              ? theme.colors.text.light
              : theme.colors.text.main
            : theme.colors.text.main,
        padding: 2,
        marginTop: 10,
        cursor: "pointer",
        width: 150,
        borderRadius: 5,
        border: "3px solid #f9a32f",
        background: group.state.on
          ? "linear-gradient(153deg, rgba(255,237,207,1) 0%, rgba(255,239,171,1) 56%)"
          : theme.colors.background.light,
      }}
      onClick={handleClick(group.id)}
    >
      <Icon
        css={{ color: innerState ? "#f9a32f" : theme.colors.text.main }}
        size={36}
        type="normal"
      >
        lightbulb
      </Icon>
      <span css={{ fontSize: 14, flexGrow: 1 }}>{group.name}</span>
    </div>
  );
};
