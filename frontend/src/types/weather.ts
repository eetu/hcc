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
