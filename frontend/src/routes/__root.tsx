import { Global, ThemeProvider } from "@emotion/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useMediaQuery } from "usehooks-ts";

import { darkTheme, lightTheme } from "../themes";

const RootLayout = () => {
  const isDarkTheme = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = isDarkTheme ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <Global
        styles={{
          html: {
            fontFamily: '"Open Sans", sans-serif',
          },
          body: {
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.body,
            color: theme.colors.text.main,
            userSelect: "none",
          },
          a: {
            color: "inherit",
            textDecoration: "none",
          },
          "*": {
            boxSizing: "border-box",
          },
          "#root": {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          },
        }}
      />
      <Outlet />
    </ThemeProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
