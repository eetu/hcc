import { Theme } from "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    mode: string;
    colors: {
      body: string;
      text: {
        main: string;
        light: string;
      };
      background: {
        main: string;
        light: string;
      };
      error: string;
      border: string;
    };
    shadows: {
      main: string;
    };
  }
}

export const lightTheme: Theme = {
  mode: "light",
  colors: {
    body: "#f0f0f0",
    text: {
      main: "#525252",
      light: "#e9e9e9",
    },
    background: {
      main: "#fff",
      light: "#fbfbfb",
    },
    error: "tomato",
    border: "lightgray",
  },
  shadows: {
    main: "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px",
  },
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: {
    body: "#0f0f0f",
    text: {
      main: "#d6d6d6",
      light: "#646464",
    },
    background: {
      main: "#252525",
      light: "#1c1c1c",
    },
    error: "pink",
    border: "#1f1f1f",
  },
  shadows: {
    main: "none",
  },
};
