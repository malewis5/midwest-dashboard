/*
  # Update sales year to 2024
  
  Updates all sales records from 2025 to 2024 to reflect the correct year.
  
  1. Changes
    - Updates all sales records with year 2025 to year 2024
    - Updates all sale_date values from 2025 to 2024
*/

-- Update the year column
UPDATE sales
SET year = 2024
WHERE year = 2025;

-- Update the sale_date column
UPDATE sales
SET sale_date = sale_date - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM sale_date) = 2025;