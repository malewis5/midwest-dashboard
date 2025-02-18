/*
  # Add image description field
  
  1. Changes
    - Add description field to customer_images table
    - Make it optional to support existing images
    - Add index for better search performance
*/

-- Add description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'customer_images' AND column_name = 'description'
    ) THEN
        ALTER TABLE customer_images ADD COLUMN description TEXT;
    END IF;
END $$;

-- Create index for description searches
CREATE INDEX IF NOT EXISTS idx_customer_images_description ON customer_images(description);