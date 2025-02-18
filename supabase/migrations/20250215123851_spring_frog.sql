/*
  # Add geocoded locations table

  1. New Tables
    - `geocoded_locations`
      - `location_id` (uuid, primary key)
      - `address_id` (uuid, foreign key to addresses)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `geocoded_locations` table
    - Add policy for public access
*/

CREATE TABLE IF NOT EXISTS geocoded_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_id UUID REFERENCES addresses(address_id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(address_id)
);

ALTER TABLE geocoded_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to geocoded_locations"
ON geocoded_locations
USING (true)
WITH CHECK (true);