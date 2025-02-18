/*
  # Fix Geocoding Table Structure

  1. Changes
    - Drop existing geocoded_locations table if it exists
    - Recreate table with proper constraints and indices
    - Add RLS policies
    - Add foreign key relationship to addresses table

  2. Security
    - Enable RLS
    - Add policy for public access (as per existing setup)
*/

-- First drop the existing table if it exists
DROP TABLE IF EXISTS geocoded_locations;

-- Recreate the table with proper structure
CREATE TABLE geocoded_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_id UUID REFERENCES addresses(address_id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT geocoded_locations_address_id_key UNIQUE(address_id)
);

-- Create an index on address_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_geocoded_locations_address_id ON geocoded_locations(address_id);

-- Enable RLS
ALTER TABLE geocoded_locations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access to geocoded_locations"
ON geocoded_locations FOR ALL
USING (true)
WITH CHECK (true);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_geocoded_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_geocoded_locations_updated_at
    BEFORE UPDATE ON geocoded_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_geocoded_locations_updated_at();