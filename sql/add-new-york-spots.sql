-- New York Surf Spots
-- Run this in Supabase SQL Editor

INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
-- NYC Area
('Rockaway Beach 67th', 'rockaway-67th', 'New York', 'Queens', 40.5835, -73.8085, 180, '44025'),
('Rockaway Beach 90th', 'rockaway-90th', 'New York', 'Queens', 40.5802, -73.8175, 180, '44025'),

-- Long Beach
('Long Beach NY', 'long-beach-ny', 'New York', 'Long Island', 40.5884, -73.6579, 180, '44025'),
('Lido Beach', 'lido-beach', 'New York', 'Long Island', 40.5886, -73.6261, 180, '44025'),

-- South Shore Long Island
('Point Lookout', 'point-lookout', 'New York', 'Long Island', 40.5928, -73.5803, 170, '44025'),
('Jones Beach', 'jones-beach', 'New York', 'Long Island', 40.5944, -73.5069, 180, '44025'),
('Gilgo Beach', 'gilgo-beach', 'New York', 'Long Island', 40.6178, -73.3922, 180, '44025'),
('Robert Moses', 'robert-moses', 'New York', 'Long Island', 40.6267, -73.2756, 175, '44025'),
('Fire Island', 'fire-island', 'New York', 'Long Island', 40.6372, -73.1736, 180, '44025'),
('Smith Point', 'smith-point', 'New York', 'Long Island', 40.7314, -72.8575, 175, '44025'),

-- Hamptons / East End
('Cupsogue Beach', 'cupsogue-beach', 'New York', 'Hamptons', 40.7958, -72.7400, 170, '44017'),
('Ponquogue Beach', 'ponquogue-beach', 'New York', 'Hamptons', 40.8375, -72.5094, 165, '44017'),
('Shinnecock Inlet', 'shinnecock-inlet', 'New York', 'Hamptons', 40.8419, -72.4744, 160, '44017'),
('Flying Point', 'flying-point', 'New York', 'Hamptons', 40.8786, -72.3986, 170, '44017'),
('Mecox Beach', 'mecox-beach', 'New York', 'Hamptons', 40.8950, -72.3214, 175, '44017'),
('Sagaponack', 'sagaponack', 'New York', 'Hamptons', 40.9164, -72.2608, 175, '44017'),
('Georgica Beach', 'georgica-beach', 'New York', 'Hamptons', 40.9394, -72.2078, 170, '44017'),
('Main Beach East Hampton', 'main-beach-east-hampton', 'New York', 'Hamptons', 40.9544, -72.1767, 165, '44017'),

-- Montauk
('Ditch Plains', 'ditch-plains', 'New York', 'Montauk', 41.0350, -71.9339, 150, '44017'),
('Montauk Point', 'montauk-point', 'New York', 'Montauk', 41.0714, -71.8569, 135, '44017')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  orientation = EXCLUDED.orientation,
  buoy_id = EXCLUDED.buoy_id;
