/*
  # Restore Territory Boundaries Table

  1. New Tables
    - `territory_boundaries`
      - `boundary_id` (uuid, primary key)
      - `territory_name` (text)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `sequence` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on territory_name for faster lookups
    - Index on coordinates for spatial queries

  3. Security
    - Enable RLS
    - Add policy for public access
*/

-- Safely create the territory boundaries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'territory_boundaries') THEN
        CREATE TABLE territory_boundaries (
            boundary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            territory_name TEXT NOT NULL,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            sequence INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;
END $$;

-- Create or replace indexes for better performance
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_territory_boundaries_name') THEN
        CREATE INDEX idx_territory_boundaries_name ON territory_boundaries(territory_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_territory_boundaries_coords') THEN
        CREATE INDEX idx_territory_boundaries_coords ON territory_boundaries(latitude, longitude);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE territory_boundaries ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
DROP POLICY IF EXISTS "Allow public access to territory_boundaries" ON territory_boundaries;
CREATE POLICY "Allow public access to territory_boundaries"
ON territory_boundaries FOR ALL
USING (true)
WITH CHECK (true);

-- Create or replace the trigger function for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_territory_boundaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating the updated_at timestamp
DROP TRIGGER IF EXISTS update_territory_boundaries_updated_at ON territory_boundaries;
CREATE TRIGGER update_territory_boundaries_updated_at
    BEFORE UPDATE ON territory_boundaries
    FOR EACH ROW
    EXECUTE FUNCTION update_territory_boundaries_updated_at();