/*
  # Add PHOCAS ID support

  1. Changes
    - Add phocas_id column to customers table
    - Create index for faster lookups
    - Add unique constraint to prevent duplicates

  2. Notes
    - phocas_id is optional to maintain compatibility with existing records
    - Index improves performance when querying by PHOCAS ID
*/

-- Add phocas_id column
ALTER TABLE customers
ADD COLUMN phocas_id VARCHAR(100);

-- Create index for PHOCAS ID lookups
CREATE INDEX idx_customers_phocas_id ON customers(phocas_id);

-- Add unique constraint
ALTER TABLE customers
ADD CONSTRAINT uq_customers_phocas_id UNIQUE (phocas_id);