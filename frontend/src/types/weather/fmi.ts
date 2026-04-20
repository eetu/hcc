export type WeatherData = {
  current: CurrentWeather | null;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  temperatureApparent: number;
  windSpeed: number;
  windGust: number | null;
  windDirection: number;
  humidity: number;
  precipitation1h: number;
  cloudCover: number | null;
  pressure: number | null;
  weatherSymbol: number;
  sunrise: string;
  sunset: string;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  temperatureApparent: number;
  windSpeed: number;
  windGust: number | null;
  windDirection: number;
  humidity: number | null;
  precipitation1h: number;
  cloudCover: number | null;
  weatherSymbol: number;
};

export type DailyForecast = {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  precipitationType: string;
  weatherSymbol: number;
  sunrise: string;
  sunset: string;
};
