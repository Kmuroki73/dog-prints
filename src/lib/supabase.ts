import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type TrackerSite = {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  tracking_key: string;
  created_at: string;
};

export type PageVisit = {
  id: string;
  site_id: string;
  user_id: string;
  url: string;
  path: string;
  domain: string;
  title: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
};
