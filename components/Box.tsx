import React, { useState } from "react";

import Icon from "./Icon";
import Spinner from "./Spinner";
import useTheme from "./useTheme";

type BoxProps = {
  className?: string;
  drawer?: React.ReactElement;
  loading?: boolean;
  error?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const Box: React.FC<BoxProps> = ({
  className,
  children,
  drawer,
  loading,
  error,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const theme = useTheme();

  if (loading) {
    return (
      <div
        className={className}
        css={{
          display: "flex",
          justifyContent: "space-around",
          minWidth: "200px",
        }}
      >
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        css={{
          display: "flex",
          justifyContent: "space-around",
          minWidth: "200px",
          color: "var(--error-color)",
        }}
      >
        <Icon>error</Icon>
      </div>
    );
  }

  return (
    <div
      className={className}
      css={[
        {
          cursor: "pointer",
        },
      ]}
      onClick={() => setCollapsed(!collapsed)}
    >
      <div
        css={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px 10px 0 0",
          backgroundColor: "var(--background-color)",
          padding: "1.5em",
          boxShadow: "var(--shadow)",
          borderBottom: collapsed ? "none" : "1px var(--border-color) solid",
        }}
      >
        {children}
      </div>
      <div
        css={{
          padding: "0 4px",
        }}
      >
        <div
          css={{
            overflowY: "scroll",
            borderLeft: "1px var(--border-color) solid",
            borderRight: "1px var(--border-color) solid",
            height: collapsed ? 0 : "initial",
          }}
        >
          {drawer}
        </div>
      </div>
      <div
        css={{
          display: "flex",
          justifyContent: "center",
          borderRadius: "0 0 10px 10px",
          height: "25px",
          backgroundColor: "var(--background-color)",
          boxShadow: "var(--shadow)",
          borderTop: collapsed ? "none" : "1px var(--border-color) solid",
          color: theme === "dark" ? "#646464" : "#e9e9e9",
        }}
      >
        <Icon>menu</Icon>
      </div>
    </div>
  );
};

export default Box;
