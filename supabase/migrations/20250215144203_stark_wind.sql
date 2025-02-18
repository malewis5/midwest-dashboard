/*
  # Fix account classification column type

  1. Changes
    - Modify account_classification column type from CHAR(1) to VARCHAR(2)
    - Drop and recreate check constraint

  2. Security
    - No changes to RLS policies
*/

-- First, drop the existing check constraint
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS valid_account_classification;

-- Modify the column type to VARCHAR(2)
ALTER TABLE customers 
ALTER COLUMN account_classification TYPE VARCHAR(2);

-- Add the check constraint back
ALTER TABLE customers 
ADD CONSTRAINT valid_account_classification 
CHECK (account_classification IN ('A', 'B', 'B+', 'C'));