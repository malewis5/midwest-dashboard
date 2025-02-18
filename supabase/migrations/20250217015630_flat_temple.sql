/*
  # Add Territory Boundaries

  1. Sample Data
    - Adds sample territory boundary points for demonstration
    - Creates polygons for major territories
    
  2. Points
    - Each territory has multiple points defining its boundary
    - Points are ordered to form a closed polygon
    - Coordinates are within US bounds
*/

-- Insert sample territory boundaries
INSERT INTO territory_boundaries (territory_name, latitude, longitude, sequence)
VALUES
  -- Denver Metro Territory
  ('Denver Metro', 39.9612, -105.2744, 1),
  ('Denver Metro', 39.9612, -104.7744, 2),
  ('Denver Metro', 39.6112, -104.7744, 3),
  ('Denver Metro', 39.6112, -105.2744, 4),
  ('Denver Metro', 39.9612, -105.2744, 5),

  -- Northern Colorado Territory
  ('Northern Colorado', 40.9853, -105.3691, 1),
  ('Northern Colorado', 40.9853, -104.5691, 2),
  ('Northern Colorado', 40.3853, -104.5691, 3),
  ('Northern Colorado', 40.3853, -105.3691, 4),
  ('Northern Colorado', 40.9853, -105.3691, 5),

  -- Southern Colorado Territory
  ('Southern Colorado', 39.1539, -105.2744, 1),
  ('Southern Colorado', 39.1539, -104.4744, 2),
  ('Southern Colorado', 38.5039, -104.4744, 3),
  ('Southern Colorado', 38.5039, -105.2744, 4),
  ('Southern Colorado', 39.1539, -105.2744, 5),

  -- Western Colorado Territory
  ('Western Colorado', 39.5539, -108.2744, 1),
  ('Western Colorado', 39.5539, -107.2744, 2),
  ('Western Colorado', 38.9039, -107.2744, 3),
  ('Western Colorado', 38.9039, -108.2744, 4),
  ('Western Colorado', 39.5539, -108.2744, 5),

  -- Eastern Colorado Territory
  ('Eastern Colorado', 39.7539, -103.2744, 1),
  ('Eastern Colorado', 39.7539, -102.2744, 2),
  ('Eastern Colorado', 39.1039, -102.2744, 3),
  ('Eastern Colorado', 39.1039, -103.2744, 4),
  ('Eastern Colorado', 39.7539, -103.2744, 5);