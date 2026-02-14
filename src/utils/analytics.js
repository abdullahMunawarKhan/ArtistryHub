// utils/analytics.js
import { supabase } from './supabase';

export async function fetchTimeSeries(tbl, timeCol, period) {
    const { data, error } = await supabase.rpc('get_time_series', { tbl, time_col: timeCol, period });
    if (error) {
        console.error("Supabase RPC error:", error);
        throw error;
    }
    return data;
}

export const CHART_THEMES = {
    blue: {
        border: '#3b82f6',
        gradient: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0)']
    },
    green: {
        border: '#22c55e',
        gradient: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0)']
    },
    purple: {
        border: '#a855f7',
        gradient: ['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0)']
    },
    orange: {
        border: '#f97316',
        gradient: ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0)']
    },
    red: {
        border: '#ef4444',
        gradient: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0)']
    }
};

export const STANDARD_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            padding: 10,
            cornerRadius: 8,
            displayColors: false
        }
    },
    scales: {
        x: {
            grid: { display: false },
            border: { display: true, color: '#94a3b8' },
            ticks: { font: { size: 10 }, color: '#64748b' }
        },
        y: {
            beginAtZero: true,
            display: true,
            grid: { display: false },
            border: { display: true, color: '#94a3b8' },
            ticks: { font: { size: 10 }, color: '#64748b', precision: 0 }
        }
    },
    interaction: { intersect: false, mode: 'index' }
};


