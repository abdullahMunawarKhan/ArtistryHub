// utils/analytics.js
import { supabase } from './supabase';

export async function fetchTimeSeries(tbl, timeCol, period) {
    console.log('fetchTimeSeries params:', { tbl, timeCol, period });
    const { data, error } = await supabase.rpc('get_time_series', { tbl, time_col: timeCol, period });
    if (error) {
        console.error("Supabase RPC error:", error);
        throw error;
    }
    return data;
}


