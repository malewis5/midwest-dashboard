/*
  # Add Territory Management Fields

  1. Changes
    - Add territory field to customers table
    - Add distance_from_branch field to customers table
    - Create index for territory searches

  2. Purpose
    - Enable territory assignment for customers
    - Track distance from branch office
    - Optimize territory-based queries
*/

-- Add territory and distance fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS territory VARCHAR(100),
ADD COLUMN IF NOT EXISTS distance_from_branch DECIMAL(10,2);

-- Create index for territory searches
CREATE INDEX IF NOT EXISTS idx_customers_territory ON customers(territory);

-- Update RLS policy to allow updates
CREATE POLICY "Allow public updates to customers"
ON customers FOR UPDATE
USING (true)
WITH CHECK (true);