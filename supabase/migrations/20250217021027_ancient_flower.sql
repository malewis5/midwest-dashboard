/*
  # Rename Southern Colorado Territory
  
  1. Changes
    - Updates territory name from "Southern Colorado" to "Outside Colorado" in territory_boundaries table
    - Updates territory name from "Southern Colorado" to "Outside Colorado" in customers table
  
  2. Notes
    - Uses safe UPDATE operations
    - Maintains data integrity by updating both tables
*/

-- Update territory name in territory_boundaries table
UPDATE territory_boundaries 
SET territory_name = 'Outside Colorado'
WHERE territory_name = 'Southern Colorado';

-- Update territory name in customers table
UPDATE customers 
SET territory = 'Outside Colorado'
WHERE territory = 'Southern Colorado';