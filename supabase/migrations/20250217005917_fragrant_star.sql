-- Create a function to safely upsert geocoded locations
CREATE OR REPLACE FUNCTION upsert_geocoded_location(
  p_address_id uuid,
  p_latitude decimal,
  p_longitude decimal
) RETURNS void AS $$
BEGIN
  -- First try to update
  UPDATE geocoded_locations
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = now()
  WHERE address_id = p_address_id;
  
  -- If no row was updated, insert
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