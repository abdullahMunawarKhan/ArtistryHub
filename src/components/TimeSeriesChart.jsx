import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';

export default function TimeSeriesChart({ data, dataKey, title }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid stroke="#e0e0e0" />
          <XAxis
            dataKey="hour_bucket"
            tickFormatter={(t) => {
              const d = new Date(t);
              return `${d.getHours().toString().padStart(2, '0')}:00`;
            }}
          />
          <YAxis allowDecimals={false} domain={[0, 'auto']} />
          <Tooltip
            labelFormatter={(t) =>
              new Date(t).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })
            }
          />
          <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
