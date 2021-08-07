import { NextApiRequest, NextApiResponse } from "next";
import { cleanEnv, str } from "envalid";
import dotenv from "dotenv";

dotenv.config();
const env = cleanEnv(process.env, {
  OPEN_WEATHER_API_KEY: str(),
});

const query = "33800,fi";

const getCurrentWeather = async () => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${query}&&units=metric&lang=fi&appid=${env.OPEN_WEATHER_API_KEY}`
  );

  return res.json();
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const weather = await getCurrentWeather();
  res.status(200).json(weather);
}
