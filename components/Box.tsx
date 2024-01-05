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
          height: "fit-content",
          boxShadow: "var(--shadow)",
        },
      ]}
      onClick={() => setCollapsed(!collapsed)}
    >
      <BoxHeader>{children}</BoxHeader>
      <BoxDrawer collapsed={collapsed}>{drawer}</BoxDrawer>
      <BoxFooter collapsed={collapsed}></BoxFooter>
    </div>
  );
};

export default Box;

const BORDER_RADIUS = 3;

type BoxHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const BoxHeader: React.FC<BoxHeaderProps> = ({ children }) => (
  <div
    css={{
      display: "flex",
      flexDirection: "column",
      borderTopLeftRadius: BORDER_RADIUS,
      borderTopRightRadius: BORDER_RADIUS,
      backgroundColor: "var(--background-color)",
      padding: "1.5em",
      borderBottom: "1px var(--border-color) solid",
    }}
  >
    {children}
  </div>
);

type BoxDrawerProps = {
  collapsed: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const BoxDrawer: React.FC<BoxDrawerProps> = ({ children, collapsed }) => (
  <div
    css={{
      padding: 0,
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
      {children}
    </div>
  </div>
);

type BoxFooterProps = {
  collapsed: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const BoxFooter: React.FC<BoxFooterProps> = ({ collapsed }) => {
  const theme = useTheme();

  return (
    <div
      css={{
        display: "flex",
        justifyContent: "center",
        borderBottomRightRadius: BORDER_RADIUS,
        borderBottomLeftRadius: BORDER_RADIUS,
        height: "25px",
        backgroundColor: "var(--background-color)",
        borderTop: collapsed ? "none" : "1px var(--border-color) solid",
        color: theme === "dark" ? "#646464" : "#e9e9e9",
      }}
    >
      <Icon>menu</Icon>
    </div>
  );
};
