import { useTheme } from "@emotion/react";
import React, { useState } from "react";

import Icon from "./Icon";
import Spinner from "./Spinner";

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
          justifyContent: "center",
          alignItems: "center",
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
          justifyContent: "center",
          color: theme.colors.error,
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
          boxShadow: theme.shadows.main,
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

const BORDER_RADIUS = 5;

type BoxHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const BoxHeader: React.FC<BoxHeaderProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        borderTopLeftRadius: BORDER_RADIUS,
        borderTopRightRadius: BORDER_RADIUS,
        backgroundColor: theme.colors.background.main,
        padding: "1.5em",
        borderBottom: `1px ${theme.colors.border} solid`,
      }}
    >
      {children}
    </div>
  );
};

type BoxDrawerProps = {
  collapsed: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const BoxDrawer: React.FC<BoxDrawerProps> = ({ children, collapsed }) => {
  const theme = useTheme();

  return (
    <div
      css={{
        padding: 0,
      }}
    >
      <div
        css={{
          overflowY: "scroll",
          borderLeft: `1px ${theme.colors.border} solid`,
          borderRight: `1px ${theme.colors.border} solid`,
          height: collapsed ? 0 : "initial",
        }}
      >
        {children}
      </div>
    </div>
  );
};

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
        backgroundColor: theme.colors.background.main,
        borderTop: collapsed ? "none" : `1px ${theme.colors.border} solid`,
        color: theme.colors.text.light,
      }}
    >
      <Icon>menu</Icon>
    </div>
  );
};
