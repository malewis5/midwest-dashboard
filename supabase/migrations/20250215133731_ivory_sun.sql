/*
  # Add Territory Boundaries Support

  1. New Tables
    - `territory_boundaries`
      - `boundary_id` (uuid, primary key)
      - `territory_name` (text, unique)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `sequence` (integer) - Order of points in the boundary
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `territory_boundaries` table
    - Add policy for public access to territory boundaries
*/

-- Create territory boundaries table
CREATE TABLE territory_boundaries (
    boundary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    territory_name TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for territory lookups
CREATE INDEX idx_territory_boundaries_name ON territory_boundaries(territory_name);
CREATE INDEX idx_territory_boundaries_coords ON territory_boundaries(latitude, longitude);

-- Enable RLS
ALTER TABLE territory_boundaries ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access to territory_boundaries"
ON territory_boundaries FOR ALL
USING (true)
WITH CHECK (true);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_territory_boundaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_territory_boundaries_updated_at
    BEFORE UPDATE ON territory_boundaries
    FOR EACH ROW
    EXECUTE FUNCTION update_territory_boundaries_updated_at();