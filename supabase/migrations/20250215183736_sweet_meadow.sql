/*
  # Add customer notes functionality

  1. New Tables
    - `customer_notes`
      - `note_id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `customer_notes` table
    - Add policy for public access to notes
*/

-- Create customer_notes table
CREATE TABLE customer_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at);

-- Enable RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access to customer_notes"
ON customer_notes FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating the updated_at timestamp
CREATE TRIGGER update_customer_notes_updated_at
    BEFORE UPDATE ON customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_notes_updated_at();