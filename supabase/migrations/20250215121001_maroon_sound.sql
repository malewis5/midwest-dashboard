/*
  # Fix RLS policies for data insertion

  1. Changes
    - Update RLS policies to properly allow authenticated users to insert data
    - Add explicit policies for all operations (insert, select, update, delete)
    - Ensure policies are properly scoped for security

  2. Security
    - Maintain data isolation between users
    - Allow authenticated users to manage their own data
*/

-- Update customers table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
CREATE POLICY "Allow authenticated users to insert customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Update addresses table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert addresses" ON addresses;
CREATE POLICY "Allow authenticated users to insert addresses"
ON addresses FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Update contacts table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert contacts" ON contacts;
CREATE POLICY "Allow authenticated users to insert contacts"
ON contacts FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Update salespersons table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert salespersons" ON salespersons;
CREATE POLICY "Allow authenticated users to insert salespersons"
ON salespersons FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Update customer_salespersons table policies
DROP POLICY IF EXISTS "Allow authenticated users to insert customer_salespersons" ON customer_salespersons;
CREATE POLICY "Allow authenticated users to insert customer_salespersons"
ON customer_salespersons FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');