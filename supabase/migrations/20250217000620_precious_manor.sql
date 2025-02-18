/*
  # Add Introduced Myself Feature

  1. New Fields
    - `introduced_myself` (boolean) - Tracks if sales rep has introduced themselves
    - `introduced_myself_at` (timestamptz) - When the introduction was made
    - `introduced_myself_by` (text) - Who made the introduction

  2. Changes
    - Add fields to customers table
    - Create index for efficient queries
*/

-- Add introduced_myself fields to customers table
ALTER TABLE customers 
ADD COLUMN introduced_myself BOOLEAN DEFAULT false,
ADD COLUMN introduced_myself_at TIMESTAMPTZ,
ADD COLUMN introduced_myself_by TEXT;

-- Create index for introduced_myself queries
CREATE INDEX idx_customers_introduced_myself ON customers(introduced_myself);

-- Enable RLS
CREATE POLICY "Allow public updates to introduced_myself"
ON customers
FOR UPDATE
USING (true)
WITH CHECK (true);