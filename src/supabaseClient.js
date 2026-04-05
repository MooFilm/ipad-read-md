import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const privateBucketName =
  import.meta.env.VITE_SUPABASE_PRIVATE_BUCKET ?? 'private-docs'

export const authAliases = {
  thirasak: import.meta.env.VITE_AUTH_ADMIN_EMAIL ?? 'thirasak@readmd.local',
  user: import.meta.env.VITE_AUTH_USER_EMAIL ?? 'user@readmd.local',
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
