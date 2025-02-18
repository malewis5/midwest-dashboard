/*
  # Add Account Classification

  1. Changes
    - Add account_classification column to customers table
    - Add check constraint to ensure valid classifications (A, B, C)
    - Create index for efficient classification queries

  2. Security
    - Maintain existing RLS policies
*/

-- Add account_classification column with check constraint
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS account_classification CHAR(1),
ADD CONSTRAINT valid_account_classification 
  CHECK (account_classification IN ('A', 'B', 'C'));

-- Create index for classification queries
CREATE INDEX IF NOT EXISTS idx_customers_classification 
ON customers(account_classification);