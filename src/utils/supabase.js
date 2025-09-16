// utils/supabase.js

import { createClient } from '@supabase/supabase-js'

// Read Vite environment variables
const supabaseUrl =import.meta.env.VITE_SUPABASE_URL 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 

// Validate
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not defined')
  throw new Error('VITE_SUPABASE_URL is required')
}
if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not defined')
  throw new Error('VITE_SUPABASE_ANON_KEY is required')
}

// Create Supabase client (v2)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
