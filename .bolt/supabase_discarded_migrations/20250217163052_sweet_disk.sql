-- Drop existing tables to rebuild with proper relationships
DROP TABLE IF EXISTS customer_images CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS geocoded_locations CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create customers table
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    territory VARCHAR(100),
    distance_from_branch DECIMAL(10,2),
    account_classification VARCHAR(2) CHECK (account_classification IN ('A', 'B', 'B+', 'C')),
    phocas_id VARCHAR(100) UNIQUE,
    introduced_myself BOOLEAN DEFAULT false,
    introduced_myself_at TIMESTAMPTZ,
    introduced_myself_by TEXT,
    visited_account BOOLEAN DEFAULT false,
    visited_account_at TIMESTAMPTZ,
    visited_account_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create addresses table
CREATE TABLE addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create geocoded_locations table
CREATE TABLE geocoded_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_id UUID REFERENCES addresses(address_id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT geocoded_locations_address_id_key UNIQUE(address_id)
);

-- Create sales table
CREATE TABLE sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    sales_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2030),
    comparison_type VARCHAR(4) NOT NULL CHECK (comparison_type IN ('YTD', 'FULL')),
    period INTEGER CHECK (period BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create contacts table
CREATE TABLE contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_images table
CREATE TABLE customer_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_notes table
CREATE TABLE customer_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_customers_territory ON customers(territory);
CREATE INDEX idx_customers_classification ON customers(account_classification);
CREATE INDEX idx_customers_phocas_id ON customers(phocas_id);
CREATE INDEX idx_customers_introduced_myself ON customers(introduced_myself);
CREATE INDEX idx_customers_visited_account ON customers(visited_account);

CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX idx_geocoded_locations_address_id ON geocoded_locations(address_id);
CREATE INDEX idx_geocoded_locations_coords ON geocoded_locations(latitude, longitude);

CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_year ON sales(year);
CREATE INDEX idx_sales_comparison ON sales(comparison_type);
CREATE INDEX idx_sales_period ON sales(period);
CREATE INDEX idx_sales_composite ON sales(customer_id, year, comparison_type, period);

CREATE INDEX idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX idx_customer_images_customer_id ON customer_images(customer_id);
CREATE INDEX idx_customer_images_created_at ON customer_images(created_at);
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at);
CREATE INDEX idx_customer_notes_hidden ON customer_notes(hidden);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocoded_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to addresses" ON addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to geocoded_locations" ON geocoded_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to customer_images" ON customer_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to customer_notes" ON customer_notes FOR ALL USING (true) WITH CHECK (true);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_geocoded_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_customer_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_customer_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_geocoded_locations_updated_at
    BEFORE UPDATE ON geocoded_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_geocoded_locations_updated_at();

CREATE TRIGGER update_customer_images_updated_at
    BEFORE UPDATE ON customer_images
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_images_updated_at();

CREATE TRIGGER update_customer_notes_updated_at
    BEFORE UPDATE ON customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_notes_updated_at();

-- Create geocoding function
CREATE OR REPLACE FUNCTION upsert_geocoded_location(
  p_address_id uuid,
  p_latitude decimal,
  p_longitude decimal
) RETURNS void AS $$
BEGIN
  UPDATE geocoded_locations
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = now()
  WHERE address_id = p_address_id;
  
  IF NOT FOUND THEN
    INSERT INTO geocoded_locations (
      address_id,
      latitude,
      longitude
    )
    VALUES (
      p_address_id,
      p_latitude,
      p_longitude
    )
    ON CONFLICT (address_id) DO UPDATE
    SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql;