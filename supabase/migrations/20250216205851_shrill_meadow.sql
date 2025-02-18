/*
  # Add Year-to-Date Sales Comparison Support
  
  1. Changes
    - Add comparison_type column to identify YTD vs full year sales
    - Add period column to store the month/period for YTD comparisons
    - Add indexes for efficient querying
  
  2. Notes
    - comparison_type: 'YTD' or 'FULL'
    - period: 1-12 representing the month for YTD comparisons
*/

-- Add new columns for YTD comparison support
ALTER TABLE sales
ADD COLUMN comparison_type VARCHAR(4) DEFAULT 'FULL' CHECK (comparison_type IN ('YTD', 'FULL')),
ADD COLUMN period INTEGER CHECK (period BETWEEN 1 AND 12);

-- Create indexes for efficient querying
CREATE INDEX idx_sales_comparison ON sales(comparison_type);
CREATE INDEX idx_sales_period ON sales(period);
CREATE INDEX idx_sales_composite ON sales(customer_id, year, comparison_type, period);

-- Update existing records to FULL comparison type
UPDATE sales 
SET comparison_type = 'FULL'
WHERE comparison_type IS NULL;

-- Make comparison_type required
ALTER TABLE sales
ALTER COLUMN comparison_type SET NOT NULL;