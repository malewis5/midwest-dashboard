-- Add hidden flag to customer_notes table
ALTER TABLE customer_notes
ADD COLUMN hidden BOOLEAN DEFAULT false;

-- Create index for hidden flag
CREATE INDEX idx_customer_notes_hidden ON customer_notes(hidden);

-- Update existing notes to be visible
UPDATE customer_notes SET hidden = false WHERE hidden IS NULL;