import { NextApiRequest, NextApiResponse } from "next";
import { cleanEnv, str } from "envalid";
import dotenv from "dotenv";

dotenv.config();
const env = cleanEnv(process.env, {
  OPEN_WEATHER_API_KEY: str(),
});

const query = "33800,fi";
const lat = "61.478398";
const lon = "23.795573";

export type WeatherCurrent = {
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

export type WeatherHourly = {
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
};

export type WeatherDaily = {
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
  rain: number;
};

export type WeatherReponse = {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: WeatherCurrent;
  hourly: Array<WeatherHourly>;
  daily: Array<WeatherDaily>;
};

const getCurrentWeather = async () => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${env.OPEN_WEATHER_API_KEY}&lang=fi`
  );

  return res.json();
};

const getWeather = async () => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appId=${env.OPEN_WEATHER_API_KEY}&lang=fi`
  );
  return res.json();
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const weather = await getWeather();
  res.status(200).json(weather);
}
