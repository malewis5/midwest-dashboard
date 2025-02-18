/*
  # Update RLS policies for public access

  1. Changes
    - Update RLS policies to allow public access for development/demo purposes
    - Enable unrestricted access for basic CRUD operations
    - Note: In production, this should be replaced with proper authentication

  2. Security
    - This is for development/demo purposes only
    - In production, implement proper authentication and user-specific policies
*/

-- Update customers table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
CREATE POLICY "Allow public access to customers"
ON customers
USING (true)
WITH CHECK (true);

-- Update addresses table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert addresses" ON addresses;
CREATE POLICY "Allow public access to addresses"
ON addresses
USING (true)
WITH CHECK (true);

-- Update contacts table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert contacts" ON contacts;
CREATE POLICY "Allow public access to contacts"
ON contacts
USING (true)
WITH CHECK (true);

-- Update salespersons table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert salespersons" ON salespersons;
CREATE POLICY "Allow public access to salespersons"
ON salespersons
USING (true)
WITH CHECK (true);

-- Update customer_salespersons table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert customer_salespersons" ON customer_salespersons;
CREATE POLICY "Allow public access to customer_salespersons"
ON customer_salespersons
USING (true)
WITH CHECK (true);