import { Theme } from "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    mode: string;
    colors: {
      body: string;
      text: {
        main: string;
        muted: string;
        light: string;
      };
      background: {
        main: string;
        light: string;
      };
      error: string;
      border: string;
      activity: {
        on: string;
        onBackground: string;
        offBackground: string;
      };
      connected: string;
      disconnected: string;
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
      muted: "#a0a0a0",
      light: "#e9e9e9",
    },
    background: {
      main: "#fff",
      light: "#fbfbfb",
    },
    error: "tomato",
    border: "lightgray",
    activity: {
      on: "#f78f08",
      onBackground: "linear-gradient(153deg, rgba(255,237,207,1) 0%, rgba(255,239,171,1) 56%)",
      offBackground: "#d9d9d9",
    },
    connected: "#4caf50",
    disconnected: "#f44336",
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
      muted: "#8a8a8a",
      light: "#646464",
    },
    background: {
      main: "#252525",
      light: "#1c1c1c",
    },
    error: "pink",
    border: "#1f1f1f",
    activity: {
      on: "#f78f08",
      onBackground: "rgba(247, 143, 8, 0.2)",
      offBackground: "#404040",
    },
    connected: "#4caf50",
    disconnected: "#f44336",
  },
  shadows: {
    main: "none",
  },
};
