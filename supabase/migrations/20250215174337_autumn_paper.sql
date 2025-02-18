/*
  # Update Customer Images Table

  This migration safely updates the customer_images table structure if it exists,
  or creates it if it doesn't.

  1. Changes
    - Ensures table exists with correct structure
    - Adds/updates indexes
    - Ensures RLS is enabled
    - Updates trigger function

  2. Security
    - Maintains public access policy
*/

-- Safely create or update the customer_images table
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_images') THEN
        CREATE TABLE customer_images (
            image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            filename TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;

    -- Create or replace indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customer_images_customer_id') THEN
        CREATE INDEX idx_customer_images_customer_id ON customer_images(customer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customer_images_created_at') THEN
        CREATE INDEX idx_customer_images_created_at ON customer_images(created_at);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE customer_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Allow public access to customer_images" ON customer_images;
CREATE POLICY "Allow public access to customer_images"
ON customer_images FOR ALL
USING (true)
WITH CHECK (true);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_customer_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_customer_images_updated_at ON customer_images;
CREATE TRIGGER update_customer_images_updated_at
    BEFORE UPDATE ON customer_images
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_images_updated_at();