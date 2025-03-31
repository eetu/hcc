import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { NextApiRequest, NextApiResponse } from "next";

dotenv.config();

const env = cleanEnv(process.env, {
  TOMORROW_IO_API_KEY: str({ default: "" }),
  POSITION_LAT: str(),
  POSITION_LON: str(),
  LANGUAGE: str({ default: "fi" }),
});

export type TomorrowWeatherData = {
  data?: {
    timelines: Timeline[];
    warnings: Warning[];
  };
};

type Timeline = {
  timestep: string;
  endTime: string;
  startTime: string;
  intervals: Interval[];
};

export type Interval = {
  startTime: string;
  values: Values;
};

type Values = {
  cloudBase: number | null;
  cloudCeiling: number | null;
  cloudCover: number;
  precipitationIntensity: number;
  precipitationProbabilityAvg: number;
  precipitationType: number;
  temperature: number;
  temperatureApparent: number;
  weatherCode: number;
  windDirection: number;
  windGust: number;
  windSpeed: number;
  sunriseTime: string;
  sunsetTime: string;
  rainAccumulation: number;
  snowAccumulation: number;
};

type Warning = {
  code: number;
  type: string;
  message: string;
  meta: Meta;
};

type Meta = {
  from: string;
  to: string;
  timestep: string;
};

type WeatherCache = {
  data: TomorrowWeatherData;
  timestamp: number;
  ttl: number;
};

const weatherCache: WeatherCache = {
  data: {
    data: {
      timelines: [],
      warnings: [],
    },
  },
  timestamp: 0,
  ttl: 30 * 60 * 1000, // 30 minutes
};

const getTomorrowWeather = async (): Promise<TomorrowWeatherData> => {
  const now = Date.now();
  if (weatherCache.data && now - weatherCache.timestamp < weatherCache.ttl) {
    console.log("Return cached weather data");
    return weatherCache.data;
  }

  const fields = [
    "precipitationProbabilityAvg",
    "precipitationIntensity",
    "precipitationType",
    "windSpeed",
    "windGust",
    "windDirection",
    "temperature",
    "temperatureApparent",
    "cloudCover",
    "cloudBase",
    "cloudCeiling",
    "weatherCode",
    "sunriseTime",
    "sunsetTime",
    "rainAccumulation",
    "snowAccumulation",
  ];

  const timesteps = ["current", "1d", "1h"];

  const url = `https://api.tomorrow.io/v4/timelines?location=${env.POSITION_LAT},${env.POSITION_LON}&apikey=${env.TOMORROW_IO_API_KEY}&timesteps=${timesteps.join(",")}&fields=${fields.join(",")}&timezone=Europe/Helsinki`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch weather, status: ${res.status}`);
    }
    const weatherResponse: TomorrowWeatherData = await res.json();

    // Update cache
    weatherCache.data = weatherResponse;
    weatherCache.timestamp = now;

    return weatherResponse;
  } catch (error) {
    console.error(error);
    return weatherCache.data || Promise.reject("No cached data available");
  }
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.json(await getTomorrowWeather());
}
