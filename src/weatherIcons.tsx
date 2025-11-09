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

// Map OpenWeatherMap weather IDs to Lucide icons
export const owmWeatherIconMap: Record<number, WeatherIconMapping> = {
  // Thunderstorm (200-232)
  200: { icon: Zap, description: "Thunderstorm with light rain" },
  201: { icon: Zap, description: "Thunderstorm with rain" },
  202: { icon: Zap, description: "Thunderstorm with heavy rain" },
  210: { icon: Zap, description: "Light thunderstorm" },
  211: { icon: Zap, description: "Thunderstorm" },
  212: { icon: Zap, description: "Heavy thunderstorm" },
  221: { icon: Zap, description: "Ragged thunderstorm" },
  230: { icon: Zap, description: "Thunderstorm with light drizzle" },
  231: { icon: Zap, description: "Thunderstorm with drizzle" },
  232: { icon: Zap, description: "Thunderstorm with heavy drizzle" },

  // Drizzle (300-321)
  300: { icon: CloudDrizzle, description: "Light drizzle" },
  301: { icon: CloudDrizzle, description: "Drizzle" },
  302: { icon: CloudDrizzle, description: "Heavy drizzle" },
  310: { icon: CloudDrizzle, description: "Light drizzle rain" },
  311: { icon: CloudDrizzle, description: "Drizzle rain" },
  312: { icon: CloudDrizzle, description: "Heavy drizzle rain" },
  313: { icon: CloudDrizzle, description: "Shower rain and drizzle" },
  314: { icon: CloudDrizzle, description: "Heavy shower rain and drizzle" },
  321: { icon: CloudDrizzle, description: "Shower drizzle" },

  // Rain (500-531)
  500: { icon: CloudDrizzle, description: "Light rain" },
  501: { icon: CloudRain, description: "Moderate rain" },
  502: { icon: CloudRain, description: "Heavy rain" },
  503: { icon: CloudRain, description: "Very heavy rain" },
  504: { icon: CloudRain, description: "Extreme rain" },
  511: { icon: CloudRain, description: "Freezing rain" },
  520: { icon: CloudRain, description: "Light shower rain" },
  521: { icon: CloudRain, description: "Shower rain" },
  522: { icon: CloudRain, description: "Heavy shower rain" },
  531: { icon: CloudRain, description: "Ragged shower rain" },

  // Snow (600-622)
  600: { icon: CloudSnow, description: "Light snow" },
  601: { icon: CloudSnow, description: "Snow" },
  602: { icon: CloudSnow, description: "Heavy snow" },
  611: { icon: CloudHail, description: "Sleet" },
  612: { icon: CloudHail, description: "Light shower sleet" },
  613: { icon: CloudHail, description: "Shower sleet" },
  615: { icon: CloudSnow, description: "Light rain and snow" },
  616: { icon: CloudSnow, description: "Rain and snow" },
  620: { icon: Snowflake, description: "Light shower snow" },
  621: { icon: Snowflake, description: "Shower snow" },
  622: { icon: CloudSnow, description: "Heavy shower snow" },

  // Atmosphere (700-781)
  701: { icon: CloudFog, description: "Mist" },
  711: { icon: CloudFog, description: "Smoke" },
  721: { icon: CloudFog, description: "Haze" },
  731: { icon: CloudFog, description: "Dust" },
  741: { icon: CloudFog, description: "Fog" },
  751: { icon: CloudFog, description: "Sand" },
  761: { icon: CloudFog, description: "Dust" },
  762: { icon: CloudFog, description: "Volcanic ash" },
  771: { icon: Cloud, description: "Squalls" },
  781: { icon: Cloud, description: "Tornado" },

  // Clear (800)
  800: { icon: Sun, description: "Clear sky" },

  // Clouds (801-804)
  801: { icon: CloudSun, description: "Few clouds" },
  802: { icon: CloudSun, description: "Scattered clouds" },
  803: { icon: Cloudy, description: "Broken clouds" },
  804: { icon: Cloud, description: "Overcast clouds" },
};

// Map Tomorrow.io weather codes to Lucide icons
export const weatherIconMap: Record<number, WeatherIconMapping> = {
  // Clear/Sunny
  0: { icon: Sun, description: "Unknown" },
  1000: { icon: Sun, description: "Clear, Sunny" },
  1100: { icon: CloudSun, description: "Mostly Clear" },
  1101: { icon: CloudSun, description: "Partly Cloudy" },
  1102: { icon: Cloudy, description: "Mostly Cloudy" },
  1001: { icon: Cloud, description: "Cloudy" },

  // Fog
  2000: { icon: CloudFog, description: "Fog" },
  2100: { icon: CloudFog, description: "Light Fog" },

  // Drizzle/Rain
  4000: { icon: CloudDrizzle, description: "Drizzle" },
  4001: { icon: CloudRain, description: "Rain" },
  4200: { icon: CloudDrizzle, description: "Light Rain" },
  4201: { icon: CloudRain, description: "Heavy Rain" },

  // Snow
  5000: { icon: CloudSnow, description: "Snow" },
  5001: { icon: Snowflake, description: "Flurries" },
  5100: { icon: CloudSnow, description: "Light Snow" },
  5101: { icon: CloudSnow, description: "Heavy Snow" },

  // Freezing Rain
  6000: { icon: CloudRain, description: "Freezing Drizzle" },
  6001: { icon: CloudRain, description: "Freezing Rain" },
  6200: { icon: CloudDrizzle, description: "Light Freezing Rain" },
  6201: { icon: CloudRain, description: "Heavy Freezing Rain" },

  // Ice Pellets
  7000: { icon: CloudHail, description: "Ice Pellets" },
  7101: { icon: CloudHail, description: "Heavy Ice Pellets" },
  7102: { icon: CloudHail, description: "Light Ice Pellets" },

  // Thunderstorm
  8000: { icon: Zap, description: "Thunderstorm" },
};

// Get the appropriate icon for OpenWeatherMap weather ID
export const getOwmWeatherIcon = (weatherId: number): LucideIcon => {
  const mapping = owmWeatherIconMap[weatherId];
  return mapping?.icon || Cloud; // Fallback icon
};

// Get the appropriate icon for Tomorrow.io weather code
export const getWeatherIcon = (
  weatherCode: number,
  isNight?: boolean
): LucideIcon => {
  const mapping = weatherIconMap[weatherCode];

  if (!mapping) {
    return Cloud; // Fallback icon
  }

  // Use moon icon for clear conditions at night
  if (isNight && (weatherCode === 1000 || weatherCode === 1100)) {
    return Moon;
  }

  return mapping.icon;
};

// Get weather description for Tomorrow.io
export const getWeatherDescription = (weatherCode: number): string => {
  return weatherIconMap[weatherCode]?.description || "Unknown";
};
