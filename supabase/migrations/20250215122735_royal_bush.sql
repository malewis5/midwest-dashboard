/*
  # Add RLS policy for sales table

  1. Security
    - Add policy to allow public access to sales table for both reading and writing
*/

-- Update sales table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON sales;
CREATE POLICY "Allow public access to sales"
ON sales
USING (true)
WITH CHECK (true);