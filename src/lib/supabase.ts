import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wulhokolymckmqqcwyuh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGhva29seW1ja21xcWN3eXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODU5MTMsImV4cCI6MjA5NDI2MTkxM30.rDKhAW2NFsu0JgoZ6qLjYON2KFxEfa0kKFocSJq37D0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
