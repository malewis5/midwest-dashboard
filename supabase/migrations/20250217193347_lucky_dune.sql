/*
  # Remove Email Uniqueness Constraint

  1. Changes
    - Remove unique constraint from contacts.email
    - Maintain email field but allow duplicates
    - Keep existing contact data intact

  2. Notes
    - Multiple contacts can now share the same email
    - Preserves existing contact information
    - No data loss during migration
*/

-- Drop the unique constraint from contacts.email
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_key;

-- Create index for email searches (non-unique)
DROP INDEX IF EXISTS idx_contacts_email;
CREATE INDEX idx_contacts_email ON contacts(email);

-- Update the contacts table definition to ensure email is still required
ALTER TABLE contacts 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN email TYPE VARCHAR(255);