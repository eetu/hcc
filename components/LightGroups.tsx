import { useTheme } from "@emotion/react";
import { FC, useCallback, useState } from "react";

import { Group } from "../pages/api/hue";
import Icon from "./Icon";

type LightGroupsProps = {
  groups: Group[];
};

const LightGroups: FC<LightGroupsProps> = ({ groups }) => {
  return (
    <div>
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
        marginTop: 10,
        cursor: "pointer",
      }}
      onClick={handleClick(group.id)}
    >
      <Icon
        css={{ color: innerState ? "orange" : theme.colors.text.main }}
        size={42}
        type="normal"
      >
        lightbulb
      </Icon>
      <span css={{ fontSize: 14 }}>{group.name}</span>
    </div>
  );
};
