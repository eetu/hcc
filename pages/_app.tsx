//import "../styles/globals.css";

import { Global } from "@emotion/react";
import type { AppProps } from "next/app";

import useTheme from "../components/useTheme";

const App = ({ Component, pageProps }: AppProps) => {
  const theme = useTheme();
  return (
    <>
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
            backgroundColor: "var(--body-color)",
            color: "var(--color)",
            userSelect: "none",
            "-webkit-tap-highlight-color": "transparent",
          },
          a: {
            color: "inherit",
            textDecoration: "none",
          },
          ["*"]: {
            boxSizing: "border-box",
          },
          ":root":
            theme === "dark"
              ? {
                  "--body-color": "#0f0f0f",
                  "--background-color": "#252525",
                  "--color": "#d6d6d6",
                  "--even-color": "#1c1c1c",
                  "--shadow": "none",
                  "--border-color": "#1f1f1f",
                }
              : {
                  "--body-color": "#f0f0f0",
                  "--color": "#525252",
                  "--background-color": "#fff",
                  "--even-color": "#fbfbfb",
                  "--error-color": "tomato",
                  "--shadow":
                    "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px",
                  "--border-color": "lightgray",
                },
        }}
      ></Global>
      <Component {...pageProps} />
    </>
  );
};

export default App;
