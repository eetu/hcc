export type PvPoint = {
  time: string;
  outputW: number;
  temperature: number | null;
  wind: number | null;
  moduleTemp: number | null;
};

export type PvForecast = {
  generatedAt: string;
  points: PvPoint[];
};
