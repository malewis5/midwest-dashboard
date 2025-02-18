/*
  # Add year field to sales table with proper constraints

  1. Changes
    - Add year column to sales table
    - Create index for year-based queries
    - Add check constraint for valid years (2020-2030)
    - Update existing records to extract year from sale_date

  2. Indexes
    - Create index on year column for faster filtering
    - Create composite index on customer_id and year for common queries

  Note: Extended year range to 2030 to accommodate future data
*/

-- First add the column without constraints
ALTER TABLE sales
ADD COLUMN year INTEGER;

-- Create indexes for better performance
CREATE INDEX idx_sales_year ON sales(year);
CREATE INDEX idx_sales_customer_year ON sales(customer_id, year);

-- Update existing records to extract year from sale_date
UPDATE sales 
SET year = EXTRACT(YEAR FROM sale_date)::INTEGER
WHERE year IS NULL;

-- Now add the check constraint with a wider range
ALTER TABLE sales
ADD CONSTRAINT valid_sales_year 
CHECK (year BETWEEN 2020 AND 2030);

-- Make year column required
ALTER TABLE sales
ALTER COLUMN year SET NOT NULL;