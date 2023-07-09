import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
} from "chart.js";
import React from "react";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
);

import useTheme from "./useTheme";

type WeatherChartData = {
  temp: number;
  rain: number;
  label: string;
};

type WeatherChartProps = {
  data: Array<WeatherChartData>;
};

const WeatherChart: React.FC<WeatherChartProps> = ({ data }) => {
  const theme = useTheme();

  const avgTemp = data.map((d) => d.temp).reduce((a, b) => a + b) / data.length;

  const weatherLineColor =
    avgTemp < 5 ? "#1a5276" : theme === "dark" ? "#c94022" : "#ff5733";

  const chartData: ChartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        type: "line",
        yAxisID: "yTemp",
        data: data.map((d) => d.temp),
        borderColor: weatherLineColor,
        pointRadius: 0,
        cubicInterpolationMode: "monotone",
      },
      {
        type: "bar",
        yAxisID: "yRain",
        data: data.map((d) => d.rain),
        backgroundColor: theme === "dark" ? "#43529c" : "#94daf7",
      },
    ],
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10,
    },
    scales: {
      x: {
        beginAtZero: false,
        grid: {
          display: false,
        },
        ticks: { color: theme === "dark" ? "#d6d6d6" : "#525252" },
      },
      yTemp: {
        position: "left",
        grid: {
          tickBorderDash: [2, 2],
        },
        ticks: {
          precision: 0,
          color: theme === "dark" ? "#d6d6d6" : "#525252",
          callback: (v) => `${v} °`,
        },
      },
      yRain: {
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          precision: 0,
          color: theme === "dark" ? "#d6d6d6" : "#525252",
          callback: (v) => `${v} mm`,
        },
      },
    },
  };

  return <Chart type="bar" options={options} data={chartData}></Chart>;
};

export default WeatherChart;
