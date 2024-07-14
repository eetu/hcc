import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import { NextApiRequest, NextApiResponse } from "next";

dotenv.config();

const env = cleanEnv(process.env, {
  OPEN_WEATHER_API_KEY: str({ default: "" }),
  TOMORROW_IO_API_KEY: str({ default: "" }),
  POSITION_LAT: str(),
  POSITION_LON: str(),
  LANGUAGE: str({ default: "fi" }),
});

export type OpenWeatherCurrent = {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
};

export type OpenWeatherHourly = {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  pop: number;
  rain?: {
    "1h"?: number;
  };
  snow?: {
    "1h"?: number;
  };
};

export type OpenWeatherDaily = {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  pop: number;
  rain?: number;
  snow?: number;
};

export type OpenWeatherAlert = {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: Array<String>;
};

export type OpenWeatherReponse = {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: OpenWeatherCurrent;
  hourly: Array<OpenWeatherHourly>;
  daily: Array<OpenWeatherDaily>;
  alerts: Array<OpenWeatherAlert>;
};

const getOpenWeather = async (): Promise<OpenWeatherReponse> => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${env.POSITION_LAT}&lon=${env.POSITION_LON}&exclude=minutely&units=metric&appId=${env.OPEN_WEATHER_API_KEY}&lang=${env.LANGUAGE}`
  );
  if (!res.ok) {
    console.error(
      `Failed to fetch weather, with status: ${res.status} and body: ${res.body}`
    );
  }
  const weatherResponse: OpenWeatherReponse = await res.json();

  return weatherResponse;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.json(await getOpenWeather());
}
