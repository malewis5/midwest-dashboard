-- Add visited_account fields to customers table
ALTER TABLE customers 
ADD COLUMN visited_account BOOLEAN DEFAULT false,
ADD COLUMN visited_account_at TIMESTAMPTZ,
ADD COLUMN visited_account_by TEXT;

-- Create index for visited_account queries
CREATE INDEX idx_customers_visited_account ON customers(visited_account);