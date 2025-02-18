-- Create customer_images table
CREATE TABLE customer_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_customer_images_customer_id ON customer_images(customer_id);
CREATE INDEX idx_customer_images_created_at ON customer_images(created_at);

-- Enable RLS
ALTER TABLE customer_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to customer_images"
ON customer_images FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_customer_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_images_updated_at
    BEFORE UPDATE ON customer_images
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_images_updated_at();