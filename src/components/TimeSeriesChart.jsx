import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CHART_THEMES, STANDARD_CHART_OPTIONS } from '../utils/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Filler,
  Legend
);

// Custom plugin to draw vertical dashed lines and arrowheads
const infographicPlugin = {
  id: 'infographicPlugin',
  afterDatasetsDraw: (chart) => {
    const { ctx, chartArea: { bottom, right, left, top } } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data.length) return;

    ctx.save();

    // Draw dashed vertical lines for each point
    meta.data.forEach((point) => {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x, bottom);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 1. Trend Line Arrowhead
    const lastPoint = meta.data[meta.data.length - 1];
    const prevPoint = meta.data[meta.data.length - 2] || { x: lastPoint.x - 1, y: lastPoint.y };
    const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
    const headlen = 12;

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.fillStyle = chart.data.datasets[0].borderColor;
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(
      lastPoint.x - headlen * Math.cos(angle - Math.PI / 6),
      lastPoint.y - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      lastPoint.x - headlen * Math.cos(angle + Math.PI / 6),
      lastPoint.y - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // 2. X-Axis Arrowhead
    ctx.beginPath();
    ctx.fillStyle = '#64748b'; // Match axis color
    ctx.moveTo(right, bottom);
    ctx.lineTo(right - 10, bottom - 5);
    ctx.lineTo(right - 10, bottom + 5);
    ctx.closePath();
    ctx.fill();

    // 3. Y-Axis Arrowhead
    ctx.beginPath();
    ctx.fillStyle = '#64748b';
    ctx.moveTo(left, top);
    ctx.lineTo(left - 5, top + 10);
    ctx.lineTo(left + 5, top + 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
};

export default function TimeSeriesChart({ data, dataKey, title, color = 'blue', period = 'day' }) {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    datasets: [],
  });

  const hasData = Array.isArray(data) && data.length > 0;

  const formatISTHour = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatISTDay = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatISTFull = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  };

  useEffect(() => {
    if (!hasData) return;

    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const theme = CHART_THEMES[color] || CHART_THEMES.blue;
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, theme.gradient[0]);
    gradient.addColorStop(1, theme.gradient[1]);

    setChartData({
      labels: data.map(item => item.hour_bucket || item.timestamp),
      datasets: [
        {
          fill: true,
          label: title || dataKey,
          data: data.map(item => item[dataKey]),
          borderColor: theme.border,
          backgroundColor: gradient,
          tension: 0, // Sharp angles like image 2
          borderWidth: 4, // Thicker line
          pointRadius: 4, // Visible points
          pointHoverRadius: 8,
          pointBackgroundColor: theme.border,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    });
  }, [data, dataKey, title, hasData, color]);

  const options = {
    ...STANDARD_CHART_OPTIONS,
    plugins: {
      ...STANDARD_CHART_OPTIONS.plugins,
      tooltip: {
        ...STANDARD_CHART_OPTIONS.plugins.tooltip,
        callbacks: {
          title: (context) => {
            return formatISTFull(context[0].label);
          },
        },
      },
    },
    scales: {
      ...STANDARD_CHART_OPTIONS.scales,
      x: {
        ...STANDARD_CHART_OPTIONS.scales.x,
        ticks: {
          ...STANDARD_CHART_OPTIONS.scales.x.ticks,
          callback: function (value, index, values) {
            const label = this.getLabelForValue(value);
            return period === 'day' ? formatISTHour(label) : formatISTDay(label);
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-0 relative px-4">
      {hasData ? (
        <Line
          ref={chartRef}
          data={chartData}
          options={options}
          plugins={[infographicPlugin]}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 text-xs italic">
          No data available
        </div>
      )}
    </div>
  );
}
