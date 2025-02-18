-- Create a function to safely update customer data
CREATE OR REPLACE FUNCTION update_customer_safely(
  p_customer_id UUID,
  p_customer_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_old_data JSONB;
  v_contact_data JSONB;
  v_address_data JSONB;
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
    'visited_account_by', c.visited_account_by
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
  WHERE customer_id = p_customer_id
  RETURNING jsonb_build_object(
    'customer_id', customer_id,
    'customer_name', customer_name,
    'account_number', account_number,
    'territory', territory,
    'account_classification', account_classification,
    'introduced_myself', introduced_myself,
    'introduced_myself_at', introduced_myself_at,
    'introduced_myself_by', introduced_myself_by,
    'visited_account', visited_account,
    'visited_account_at', visited_account_at,
    'visited_account_by', visited_account_by
  ) INTO v_result;

  -- Update contact if provided
  v_contact_data := p_customer_data->'contact';
  IF v_contact_data IS NOT NULL AND jsonb_typeof(v_contact_data) = 'object' THEN
    IF v_contact_data->>'contact_id' IS NOT NULL THEN
      -- Update existing contact
      UPDATE contacts
      SET
        contact_name = COALESCE((v_contact_data->>'contact_name'), contact_name),
        role = COALESCE((v_contact_data->>'role'), role),
        phone_number = COALESCE((v_contact_data->>'phone_number'), phone_number),
        email = COALESCE((v_contact_data->>'email'), email)
      WHERE contact_id = (v_contact_data->>'contact_id')::uuid
        AND customer_id = p_customer_id;
    END IF;
  END IF;

  -- Update address if provided
  v_address_data := p_customer_data->'address';
  IF v_address_data IS NOT NULL AND jsonb_typeof(v_address_data) = 'object' THEN
    IF v_address_data->>'address_id' IS NOT NULL THEN
      -- Update existing address
      UPDATE addresses
      SET
        street = COALESCE((v_address_data->>'street'), street),
        city = COALESCE((v_address_data->>'city'), city),
        state = COALESCE((v_address_data->>'state'), state),
        zip_code = COALESCE((v_address_data->>'zip_code'), zip_code)
      WHERE address_id = (v_address_data->>'address_id')::uuid
        AND customer_id = p_customer_id;
    END IF;
  END IF;

  -- Return the updated customer data
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