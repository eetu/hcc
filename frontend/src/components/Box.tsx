import { useTheme } from "@emotion/react";
import React, { useEffect, useRef, useState } from "react";

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
      css={{
        cursor: "pointer",
        minWidth: 0,
        overflow: "hidden",
        boxShadow: theme.shadows.main,
        borderRadius: theme.border.radius,
      }}
      onClick={() => setCollapsed(!collapsed)}
    >
      <BoxHeader>{children}</BoxHeader>
      <BoxDrawer collapsed={collapsed}>{drawer}</BoxDrawer>
      <BoxFooter collapsed={collapsed} />
    </div>
  );
};

export default Box;

type BoxHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const BoxHeader: React.FC<BoxHeaderProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
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
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!collapsed && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [collapsed]);

  return (
    <div
      ref={wrapperRef}
      css={{
        overflow: "hidden",
        height,
        transition: "height 0.15s ease",
      }}
      onTransitionEnd={() => {
        if (!collapsed) {
          wrapperRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }}
    >
      <div
        ref={contentRef}
        css={{
          overflowY: "scroll",
          borderLeft: `1px ${theme.colors.border} solid`,
          borderRight: `1px ${theme.colors.border} solid`,
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

export const DrawerRow: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
}> = ({ label, value }) => {
  const theme = useTheme();
  return (
    <div
      css={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span css={{ color: theme.colors.text.muted }}>{label}</span>
      <span>{value}</span>
    </div>
  );
};
