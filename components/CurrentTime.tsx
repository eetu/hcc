import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import React from "react";

import useCurrentTime from "./useCurrentTime";

type CurrentTimeProps = {} & React.HTMLAttributes<HTMLDivElement>;

const CurrentTime: React.FC<CurrentTimeProps> = ({ className }) => {
  const currentTime = useCurrentTime();

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
          fontSize: "6em",
        }}
      >
        <span>{format(currentTime, "p", { locale: fi })}</span>
      </div>
      <div
        css={{
          fontSize: "1.5em",
          fontWeight: "lighter",
          textTransform: "capitalize",
        }}
      >
        {format(currentTime, "EEEE dd. MMMM yyyy", { locale: fi })}
      </div>
    </div>
  );
};
export default CurrentTime;
