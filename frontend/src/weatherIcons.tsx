import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloudy,
  type LucideIcon,
  Moon,
  Snowflake,
  Sun,
  Zap,
} from "lucide-react";

type WeatherIconMapping = {
  icon: LucideIcon;
  description: string;
};

// Tomorrow.io weather codes
export const weatherIconMap: Record<number, WeatherIconMapping> = {
  0: { icon: Sun, description: "Unknown" },
  1000: { icon: Sun, description: "Clear, Sunny" },
  1100: { icon: CloudSun, description: "Mostly Clear" },
  1101: { icon: CloudSun, description: "Partly Cloudy" },
  1102: { icon: Cloudy, description: "Mostly Cloudy" },
  1001: { icon: Cloud, description: "Cloudy" },
  2000: { icon: CloudFog, description: "Fog" },
  2100: { icon: CloudFog, description: "Light Fog" },
  4000: { icon: CloudDrizzle, description: "Drizzle" },
  4001: { icon: CloudRain, description: "Rain" },
  4200: { icon: CloudDrizzle, description: "Light Rain" },
  4201: { icon: CloudRain, description: "Heavy Rain" },
  5000: { icon: CloudSnow, description: "Snow" },
  5001: { icon: Snowflake, description: "Flurries" },
  5100: { icon: CloudSnow, description: "Light Snow" },
  5101: { icon: CloudSnow, description: "Heavy Snow" },
  6000: { icon: CloudRain, description: "Freezing Drizzle" },
  6001: { icon: CloudRain, description: "Freezing Rain" },
  6200: { icon: CloudDrizzle, description: "Light Freezing Rain" },
  6201: { icon: CloudRain, description: "Heavy Freezing Rain" },
  7000: { icon: CloudHail, description: "Ice Pellets" },
  7101: { icon: CloudHail, description: "Heavy Ice Pellets" },
  7102: { icon: CloudHail, description: "Light Ice Pellets" },
  8000: { icon: Zap, description: "Thunderstorm" },
};

// FMI WeatherSymbol3 codes
export const fmiWeatherIconMap: Record<number, WeatherIconMapping> = {
  1: { icon: Sun, description: "Selkeä" },
  2: { icon: CloudSun, description: "Puolipilvinen" },
  3: { icon: Cloud, description: "Pilvinen" },
  21: { icon: CloudDrizzle, description: "Heikkoja sadekuuroja" },
  22: { icon: CloudRain, description: "Sadekuuroja" },
  23: { icon: CloudRain, description: "Voimakkaita sadekuuroja" },
  31: { icon: CloudDrizzle, description: "Heikkoa vesisadetta" },
  32: { icon: CloudRain, description: "Vesisadetta" },
  33: { icon: CloudRain, description: "Voimakasta vesisadetta" },
  41: { icon: CloudSnow, description: "Heikkoja lumikuuroja" },
  42: { icon: CloudSnow, description: "Lumikuuroja" },
  43: { icon: CloudSnow, description: "Voimakkaita lumikuuroja" },
  51: { icon: CloudSnow, description: "Heikkoa lumisadetta" },
  52: { icon: CloudSnow, description: "Lumisadetta" },
  53: { icon: Snowflake, description: "Voimakasta lumisadetta" },
  61: { icon: Zap, description: "Ukkoskuuroja" },
  62: { icon: Zap, description: "Voimakkaita ukkoskuuroja" },
  63: { icon: Zap, description: "Ukkosta" },
  64: { icon: Zap, description: "Voimakasta ukkosta" },
  71: { icon: CloudRain, description: "Heikkoa räntäsadetta" },
  72: { icon: CloudRain, description: "Räntäsadetta" },
  73: { icon: CloudRain, description: "Voimakasta räntäsadetta" },
  81: { icon: CloudDrizzle, description: "Heikkoja räntäkuuroja" },
  82: { icon: CloudRain, description: "Räntäkuuroja" },
  83: { icon: CloudRain, description: "Voimakkaita räntäkuuroja" },
  91: { icon: CloudFog, description: "Utua" },
  92: { icon: CloudFog, description: "Sumua" },
};

export const getWeatherIcon = (
  weatherCode: number,
  isNight?: boolean,
): LucideIcon => {
  const mapping = weatherIconMap[weatherCode];

  if (!mapping) {
    return Cloud;
  }

  if (isNight && (weatherCode === 1000 || weatherCode === 1100)) {
    return Moon;
  }

  return mapping.icon;
};

export const getFmiWeatherIcon = (
  weatherSymbol: number,
  isNight?: boolean,
): LucideIcon => {
  const mapping = fmiWeatherIconMap[weatherSymbol];

  if (!mapping) {
    return Cloud;
  }

  if (isNight && weatherSymbol === 1) {
    return Moon;
  }

  return mapping.icon;
};

export const getWeatherDescription = (weatherCode: number): string => {
  return weatherIconMap[weatherCode]?.description || "Unknown";
};

export const getFmiWeatherDescription = (weatherSymbol: number): string => {
  return fmiWeatherIconMap[weatherSymbol]?.description || "Tuntematon";
};
