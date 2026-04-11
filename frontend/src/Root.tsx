import { Global, ThemeProvider } from "@emotion/react";
import { useMediaQuery } from "usehooks-ts";

import App from "./App";
import { darkTheme, lightTheme } from "./themes";

const Root = () => {
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
      <App />
    </ThemeProvider>
  );
};

export default Root;
