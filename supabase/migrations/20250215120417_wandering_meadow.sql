/*
  # Initial Database Schema Setup

  1. New Tables
    - customers: Stores customer information
    - addresses: Stores customer addresses
    - sales: Records customer sales
    - contacts: Stores customer contact information
    - salespersons: Stores salesperson information
    - customer_salespersons: Links customers to salespersons

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create Customers Table
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Addresses Table
CREATE TABLE addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Sales Table
CREATE TABLE sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    sales_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Contacts Table
CREATE TABLE contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Salespersons Table
CREATE TABLE salespersons (
    salesperson_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesperson_name VARCHAR(255) NOT NULL,
    salesperson_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Customer-Salesperson Relationship Table
CREATE TABLE customer_salespersons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    salesperson_id UUID REFERENCES salespersons(salesperson_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salespersons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_salespersons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read customers"
    ON customers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert customers"
    ON customers FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Repeat similar policies for other tables
CREATE POLICY "Allow authenticated users to read addresses"
    ON addresses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert addresses"
    ON addresses FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read sales"
    ON sales FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert sales"
    ON sales FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read contacts"
    ON contacts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert contacts"
    ON contacts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read salespersons"
    ON salespersons FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert salespersons"
    ON salespersons FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read customer_salespersons"
    ON customer_salespersons FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert customer_salespersons"
    ON customer_salespersons FOR INSERT
    TO authenticated
    WITH CHECK (true);