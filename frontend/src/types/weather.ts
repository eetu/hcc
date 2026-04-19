// Tomorrow.io types (legacy)

export type TomorrowWeatherData = {
  data: {
    timelines: Timeline[];
    warnings: Warning[];
  };
};

type Timeline = {
  timestep: string;
  endTime: string;
  startTime: string;
  intervals: TomorrowInterval[];
};

export type TomorrowInterval = {
  startTime: string;
  values: TomorrowValues;
};

type TomorrowValues = {
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

// FMI types

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
