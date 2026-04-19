import "chartjs-adapter-date-fns";

import { useTheme } from "@emotion/react";
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from "chart.js";
import { format } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";

import { api } from "../api";

ChartJS.register(
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
);

type SensorReading = {
  sensorId: string;
  sensorName: string;
  temperature: number;
  roomType: string;
  recordedAt: string;
};

const RANGES = [
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7pv", hours: 168 },
  { label: "30pv", hours: 720 },
] as const;

// Base hue ranges per room type to keep visual grouping
const ROOM_TYPE_HUE: Record<string, [number, number]> = {
  outside: [200, 240],
  inside: [270, 360],
  insidecold: [100, 160],
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const sensorColor = (sensorId: string, roomType: string): string => {
  const typeKey = roomType.replace("_", "");
  const [hueMin, hueMax] = ROOM_TYPE_HUE[typeKey] ?? [0, 360];
  const hash = hashString(sensorId);
  const hue = hueMin + (hash % (hueMax - hueMin));
  const saturation = 60 + (hash % 25);
  const lightness = 40 + ((hash >> 8) % 20);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

type HistoryProps = {
  className?: string;
};

const History: React.FC<HistoryProps> = ({ className }) => {
  const theme = useTheme();
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(api(`/api/history/sensors?hours=${hours}`))
      .then((r) => r.json())
      .then((data: SensorReading[]) => {
        setReadings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hours]);

  // Group readings by sensor
  const bySensor = new Map<
    string,
    {
      id: string;
      name: string;
      roomType: string;
      points: { x: number; y: number }[];
    }
  >();
  for (const r of readings) {
    let sensor = bySensor.get(r.sensorId);
    if (!sensor) {
      sensor = {
        id: r.sensorId,
        name: r.sensorName,
        roomType: r.roomType,
        points: [],
      };
      bySensor.set(r.sensorId, sensor);
    }
    sensor.points.push({
      x: new Date(r.recordedAt).getTime(),
      y: r.temperature,
    });
  }

  // Assign colors per room type
  const datasets = [...bySensor.values()].map((sensor) => {
    const color = sensorColor(sensor.id, sensor.roomType);

    return {
      label: sensor.name,
      data: sensor.points,
      borderColor: color,
      backgroundColor: color,
      pointRadius: 0,
      borderWidth: 2,
      cubicInterpolationMode: "monotone" as const,
    };
  });

  const chartData: ChartData<"line"> = { datasets };

  const tickColor = theme.colors.text.muted;

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: theme.colors.text.main,
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}°`,
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          tooltipFormat: "d.M. HH:mm",
          displayFormats: {
            hour: "HH:mm",
            day: "d.M.",
          },
        },
        adapters: {
          date: { locale: fi },
        },
        grid: { display: false },
        ticks: {
          color: tickColor,
          maxTicksLimit: 8,
          callback: (val) => {
            const d = new Date(val as number);
            return hours <= 24
              ? format(d, "HH.mm", { locale: fi })
              : format(d, "EEEEEE d.M.", { locale: fi });
          },
        },
      },
      y: {
        grid: { tickBorderDash: [2, 2] },
        ticks: {
          color: tickColor,
          precision: 0,
          callback: (v) => `${v}°`,
        },
      },
    },
  };

  return (
    <div
      className={className}
      css={{
        backgroundColor: theme.colors.background.main,
        boxShadow: theme.shadows.main,
        borderRadius: 6,
        padding: "1.5em",
        minHeight: 300,
      }}
    >
      <div
        css={{
          display: "flex",
          gap: 8,
          marginBottom: "1em",
        }}
      >
        {RANGES.map((r) => (
          <button
            key={r.hours}
            onClick={() => setHours(r.hours)}
            css={{
              cursor: "pointer",
              padding: "4px 12px",
              borderRadius: 4,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor:
                hours === r.hours
                  ? theme.colors.text.main
                  : theme.colors.background.light,
              color:
                hours === r.hours
                  ? theme.colors.background.main
                  : theme.colors.text.main,
              ...theme.typography.body2,
              transition: "all 0.15s",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div css={{ position: "relative", height: 300 }}>
        {loading ? (
          <div
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: theme.colors.text.muted,
            }}
          >
            Ladataan...
          </div>
        ) : readings.length === 0 ? (
          <div
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: theme.colors.text.muted,
            }}
          >
            Ei historiadataa
          </div>
        ) : (
          <Chart type="line" data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default History;
