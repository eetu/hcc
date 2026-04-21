export type SolisData = {
  power: number;
  power_unit: string;
  today_energy: number;
  today_energy_unit: string;
  month_energy: number;
  month_energy_unit: string;
  year_energy: number;
  year_energy_unit: string;
  total_energy: number;
  total_energy_unit: string;
  grid_power: number | null;
  grid_power_unit: string | null;
  battery_soc: number | null;
  battery_power: number | null;
  battery_power_unit: string | null;
  /** 1 = online, 2 = offline, 3 = alarm */
  status: 1 | 2 | 3;
  updated_at: number;
};
