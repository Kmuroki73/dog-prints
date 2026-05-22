/*
  # Footprint Tracker - Core Schema

  ## Overview
  Creates all tables needed for the web time tracking SaaS.

  ## New Tables

  ### `tracker_sites`
  Registered sites/projects per user. Each site gets a unique tracking key.
  - `id` - UUID primary key
  - `user_id` - Owner (references auth.users)
  - `name` - Human-friendly site name
  - `domain` - Site domain
  - `tracking_key` - Public key embedded in snippet
  - `created_at`

  ### `page_visits`
  Individual page visit sessions recorded by the tracking snippet.
  - `id` - UUID primary key
  - `site_id` - Which site this belongs to
  - `user_id` - Owner (for RLS simplicity)
  - `url` - Full URL visited
  - `path` - URL path only
  - `domain` - Domain
  - `title` - Page title
  - `duration_seconds` - Active time in seconds (not just open-tab time)
  - `started_at` - When the visit began
  - `ended_at` - When the visit ended

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Tracker sites table
CREATE TABLE IF NOT EXISTS tracker_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT '',
  tracking_key uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracker_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sites"
  ON tracker_sites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites"
  ON tracker_sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
  ON tracker_sites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
  ON tracker_sites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Page visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES tracker_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL DEFAULT '',
  path text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visits"
  ON page_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON page_visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits"
  ON page_visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits"
  ON page_visits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public insert policy for tracking snippet (uses tracking_key, not auth)
-- We'll handle this via an edge function with service role key instead

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_site_id ON page_visits(site_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_started_at ON page_visits(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_sites_tracking_key ON tracker_sites(tracking_key);
