import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';

export default function TimeSeriesChart({ data, dataKey, title }) {
    // Utility to always show in Asia/Kolkata
    const hasData = Array.isArray(data) && data.length > 0;
    const formatISTHour = (timestamp) => {
        const d = new Date(timestamp);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata' // <--- Force IST
        });
    };

    const formatISTTooltip = (timestamp) => {
        const d = new Date(timestamp);
        return d.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata' // <--- Force IST
        });
    };

    return (
<div className="bg-white rounded shadow p-4 h-full flex flex-col justify-between">
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      {hasData ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid stroke="#e0e0e0" />
            <XAxis
              dataKey="hour_bucket"
              tickFormatter={formatISTHour}
            />
            <YAxis allowDecimals={false} domain={[0, 'auto']} />
            <Tooltip
              labelFormatter={formatISTTooltip}
            />
            <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-44 text-gray-400 text-base">
          Not enough data available
        </div>
      )}
    </div>
       
    );
}
