/*
  # Add B+ classification support

  1. Changes
    - Modify account_classification column to support 'B+' value
    - Drop existing check constraint
    - Add new check constraint with 'B+' support

  2. Security
    - No changes to RLS policies
*/

-- First, drop the existing check constraint
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS valid_account_classification;

-- Add new check constraint that includes B+
ALTER TABLE customers 
ADD CONSTRAINT valid_account_classification 
CHECK (account_classification IN ('A', 'B', 'B+', 'C'));