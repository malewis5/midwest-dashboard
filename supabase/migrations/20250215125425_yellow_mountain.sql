/*
  # Fix geocoded_locations table and relationships

  1. Changes
    - Drop and recreate geocoded_locations table with proper constraints
    - Add indexes for performance
    - Update RLS policies
*/

-- First, drop the existing table and its dependencies
DROP TABLE IF EXISTS geocoded_locations CASCADE;

-- Recreate the table with proper structure
CREATE TABLE geocoded_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE CASCADE,
    CONSTRAINT geocoded_locations_address_id_key UNIQUE(address_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_geocoded_locations_address_id ON geocoded_locations(address_id);
CREATE INDEX IF NOT EXISTS idx_geocoded_locations_coords ON geocoded_locations(latitude, longitude);

-- Enable RLS
ALTER TABLE geocoded_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
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