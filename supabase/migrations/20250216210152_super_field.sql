/*
  # Update sales table for YTD comparisons

  1. Changes
    - Add columns for YTD comparison tracking
    - Add constraints and indexes for performance
    - Update existing data

  2. New Columns
    - comparison_type: Tracks if the sales record is YTD or full year
    - period: Tracks which month the YTD data is through
    - year: Explicitly tracks which year the sales record is for

  3. Indexes
    - Added composite indexes for efficient querying
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add comparison_type if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'comparison_type'
    ) THEN
        ALTER TABLE sales
        ADD COLUMN comparison_type VARCHAR(4) DEFAULT 'FULL' CHECK (comparison_type IN ('YTD', 'FULL'));
    END IF;

    -- Add period if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'period'
    ) THEN
        ALTER TABLE sales
        ADD COLUMN period INTEGER CHECK (period BETWEEN 1 AND 12);
    END IF;

    -- Add year if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'year'
    ) THEN
        ALTER TABLE sales
        ADD COLUMN year INTEGER CHECK (year BETWEEN 2020 AND 2030);
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_comparison') THEN
        CREATE INDEX idx_sales_comparison ON sales(comparison_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_period') THEN
        CREATE INDEX idx_sales_period ON sales(period);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_year') THEN
        CREATE INDEX idx_sales_year ON sales(year);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_composite') THEN
        CREATE INDEX idx_sales_composite ON sales(customer_id, year, comparison_type, period);
    END IF;
END $$;

-- Update existing records
UPDATE sales 
SET 
    comparison_type = 'FULL',
    year = EXTRACT(YEAR FROM sale_date)::INTEGER
WHERE comparison_type IS NULL;

-- Make columns required
ALTER TABLE sales
ALTER COLUMN comparison_type SET NOT NULL,
ALTER COLUMN year SET NOT NULL;