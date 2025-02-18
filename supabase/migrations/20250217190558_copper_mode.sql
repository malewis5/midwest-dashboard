/*
  # Fix Customer Update Function

  1. Changes
    - Fix loop variable declaration for jsonb_array_elements
    - Improve error handling and rollback
    - Add proper contact and address handling
    - Return complete customer data with relations

  2. Notes
    - Uses DECLARE for all variables
    - Properly handles arrays of contacts and addresses
    - Maintains data integrity with error rollback
*/

-- Create a function to safely update customer data with proper contact handling
CREATE OR REPLACE FUNCTION update_customer_safely(
  p_customer_id UUID,
  p_customer_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_old_data JSONB;
  v_contact_data JSONB;
  v_address_data JSONB;
  v_contact RECORD;
  v_address RECORD;
BEGIN
  -- Start by getting existing customer data
  SELECT jsonb_build_object(
    'customer_id', c.customer_id,
    'customer_name', c.customer_name,
    'account_number', c.account_number,
    'territory', c.territory,
    'account_classification', c.account_classification,
    'introduced_myself', c.introduced_myself,
    'introduced_myself_at', c.introduced_myself_at,
    'introduced_myself_by', c.introduced_myself_by,
    'visited_account', c.visited_account,
    'visited_account_at', c.visited_account_at,
    'visited_account_by', c.visited_account_by,
    'contacts', (
      SELECT jsonb_agg(jsonb_build_object(
        'contact_id', ct.contact_id,
        'contact_name', ct.contact_name,
        'role', ct.role,
        'phone_number', ct.phone_number,
        'email', ct.email
      ))
      FROM contacts ct
      WHERE ct.customer_id = c.customer_id
    ),
    'addresses', (
      SELECT jsonb_agg(jsonb_build_object(
        'address_id', a.address_id,
        'street', a.street,
        'city', a.city,
        'state', a.state,
        'zip_code', a.zip_code
      ))
      FROM addresses a
      WHERE a.customer_id = c.customer_id
    )
  )
  INTO v_old_data
  FROM customers c
  WHERE c.customer_id = p_customer_id;

  IF v_old_data IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Update customer base data if provided
  UPDATE customers
  SET
    customer_name = COALESCE((p_customer_data->>'customer_name'), customer_name),
    territory = COALESCE((p_customer_data->>'territory'), territory),
    account_classification = COALESCE((p_customer_data->>'account_classification'), account_classification),
    introduced_myself = COALESCE((p_customer_data->>'introduced_myself')::boolean, introduced_myself),
    introduced_myself_at = COALESCE((p_customer_data->>'introduced_myself_at')::timestamptz, introduced_myself_at),
    introduced_myself_by = COALESCE((p_customer_data->>'introduced_myself_by'), introduced_myself_by),
    visited_account = COALESCE((p_customer_data->>'visited_account')::boolean, visited_account),
    visited_account_at = COALESCE((p_customer_data->>'visited_account_at')::timestamptz, visited_account_at),
    visited_account_by = COALESCE((p_customer_data->>'visited_account_by'), visited_account_by)
  WHERE customer_id = p_customer_id;

  -- Update contacts if provided
  v_contact_data := p_customer_data->'contacts';
  IF v_contact_data IS NOT NULL AND jsonb_typeof(v_contact_data) = 'array' THEN
    FOR v_contact IN 
      SELECT value->>'contact_id' as contact_id,
             value->>'contact_name' as contact_name,
             value->>'role' as role,
             value->>'phone_number' as phone_number,
             value->>'email' as email
      FROM jsonb_array_elements(v_contact_data) as value
    LOOP
      IF v_contact.contact_id IS NOT NULL THEN
        -- Update existing contact
        UPDATE contacts
        SET
          contact_name = COALESCE(v_contact.contact_name, contact_name),
          role = COALESCE(v_contact.role, role),
          phone_number = COALESCE(v_contact.phone_number, phone_number),
          email = COALESCE(v_contact.email, email)
        WHERE contact_id = v_contact.contact_id::uuid
          AND customer_id = p_customer_id;
      END IF;
    END LOOP;
  END IF;

  -- Update addresses if provided
  v_address_data := p_customer_data->'addresses';
  IF v_address_data IS NOT NULL AND jsonb_typeof(v_address_data) = 'array' THEN
    FOR v_address IN 
      SELECT value->>'address_id' as address_id,
             value->>'street' as street,
             value->>'city' as city,
             value->>'state' as state,
             value->>'zip_code' as zip_code
      FROM jsonb_array_elements(v_address_data) as value
    LOOP
      IF v_address.address_id IS NOT NULL THEN
        -- Update existing address
        UPDATE addresses
        SET
          street = COALESCE(v_address.street, street),
          city = COALESCE(v_address.city, city),
          state = COALESCE(v_address.state, state),
          zip_code = COALESCE(v_address.zip_code, zip_code)
        WHERE address_id = v_address.address_id::uuid
          AND customer_id = p_customer_id;
      END IF;
    END LOOP;
  END IF;

  -- Get updated data for return
  SELECT jsonb_build_object(
    'customer_id', c.customer_id,
    'customer_name', c.customer_name,
    'account_number', c.account_number,
    'territory', c.territory,
    'account_classification', c.account_classification,
    'introduced_myself', c.introduced_myself,
    'introduced_myself_at', c.introduced_myself_at,
    'introduced_myself_by', c.introduced_myself_by,
    'visited_account', c.visited_account,
    'visited_account_at', c.visited_account_at,
    'visited_account_by', c.visited_account_by,
    'contacts', (
      SELECT jsonb_agg(jsonb_build_object(
        'contact_id', ct.contact_id,
        'contact_name', ct.contact_name,
        'role', ct.role,
        'phone_number', ct.phone_number,
        'email', ct.email
      ))
      FROM contacts ct
      WHERE ct.customer_id = c.customer_id
    ),
    'addresses', (
      SELECT jsonb_agg(jsonb_build_object(
        'address_id', a.address_id,
        'street', a.street,
        'city', a.city,
        'state', a.state,
        'zip_code', a.zip_code
      ))
      FROM addresses a
      WHERE a.customer_id = c.customer_id
    )
  )
  INTO v_result
  FROM customers c
  WHERE c.customer_id = p_customer_id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback to the old data in case of any error
    UPDATE customers
    SET
      customer_name = v_old_data->>'customer_name',
      territory = v_old_data->>'territory',
      account_classification = v_old_data->>'account_classification',
      introduced_myself = (v_old_data->>'introduced_myself')::boolean,
      introduced_myself_at = (v_old_data->>'introduced_myself_at')::timestamptz,
      introduced_myself_by = v_old_data->>'introduced_myself_by',
      visited_account = (v_old_data->>'visited_account')::boolean,
      visited_account_at = (v_old_data->>'visited_account_at')::timestamptz,
      visited_account_by = v_old_data->>'visited_account_by'
    WHERE customer_id = p_customer_id;
    
    RAISE EXCEPTION 'Error updating customer: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;