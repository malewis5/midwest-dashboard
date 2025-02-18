/*
  # Update Territory Boundaries Table

  This migration safely updates or creates the territory boundaries table and its supporting objects.
  It uses IF NOT EXISTS and IF EXISTS clauses to prevent errors if objects already exist.

  1. Table Structure
    - Checks if table exists before creating
    - Adds indexes for performance
    - Enables RLS
    - Adds trigger for updated_at timestamp
*/

-- Safely create the table if it doesn't exist
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

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_territory_boundaries_name') THEN
        CREATE INDEX idx_territory_boundaries_name ON territory_boundaries(territory_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_territory_boundaries_coords') THEN
        CREATE INDEX idx_territory_boundaries_coords ON territory_boundaries(latitude, longitude);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS territory_boundaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Allow public access to territory_boundaries" ON territory_boundaries;
CREATE POLICY "Allow public access to territory_boundaries"
ON territory_boundaries FOR ALL
USING (true)
WITH CHECK (true);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_territory_boundaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_territory_boundaries_updated_at ON territory_boundaries;
CREATE TRIGGER update_territory_boundaries_updated_at
    BEFORE UPDATE ON territory_boundaries
    FOR EACH ROW
    EXECUTE FUNCTION update_territory_boundaries_updated_at();