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
  tags: Array<string>;
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
