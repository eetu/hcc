import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

export type Theme = "light" | "dark";

const useTheme = () => {
  const isDarkTheme = useMediaQuery("(prefers-color-scheme: dark)");

  const [theme, setTheme] = useState<Theme>(isDarkTheme ? "dark" : "light");

  useEffect(() => {
    setTheme(isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  return theme;
};

export default useTheme;
