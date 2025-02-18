/*
  # Add Password Protection
  
  1. New Tables
    - `app_settings`
      - `setting_id` (uuid, primary key)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for public access
*/

-- Create app_settings table
CREATE TABLE app_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access to app_settings"
ON app_settings FOR ALL
USING (true)
WITH CHECK (true);

-- Insert initial password hash for "DenverWins1!"
INSERT INTO app_settings (password_hash)
VALUES ('$2a$10$QX9NycdQZNqhNrvALs5sOOv8KgR1Vf8J9xGqK3XZsv8YzYk5ZmHKG');