//import "../styles/globals.css";

import { Global, ThemeProvider } from "@emotion/react";
import type { AppProps } from "next/app";
import { useMediaQuery } from "usehooks-ts";

import { darkTheme, lightTheme } from "../src/themes";

const App = ({ Component, pageProps }: AppProps) => {
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
            padding: "0 0.5rem",
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
          ["*"]: {
            boxSizing: "border-box",
          },
        }}
      ></Global>
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;
