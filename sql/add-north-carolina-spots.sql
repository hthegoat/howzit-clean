-- North Carolina Surf Spots
-- Run this in Supabase SQL Editor

INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
-- Outer Banks - North
('Corolla', 'corolla', 'North Carolina', 'Outer Banks', 36.3761, -75.8302, 90, '44014'),
('Duck Pier', 'duck-pier', 'North Carolina', 'Outer Banks', 36.1697, -75.7517, 85, '44014'),
('Kitty Hawk Pier', 'kitty-hawk-pier', 'North Carolina', 'Outer Banks', 36.0647, -75.7058, 80, '44014'),
('Kill Devil Hills', 'kill-devil-hills', 'North Carolina', 'Outer Banks', 36.0308, -75.6761, 85, '44014'),
('Nags Head Pier', 'nags-head-pier', 'North Carolina', 'Outer Banks', 35.9575, -75.6247, 80, '44014'),
('Jennettes Pier', 'jennettes-pier', 'North Carolina', 'Outer Banks', 35.9097, -75.5972, 85, '44014'),

-- Outer Banks - Hatteras Island  
('Oregon Inlet', 'oregon-inlet', 'North Carolina', 'Outer Banks', 35.7958, -75.5481, 90, '41025'),
('Pea Island', 'pea-island', 'North Carolina', 'Outer Banks', 35.7086, -75.4914, 85, '41025'),
('Rodanthe Pier', 'rodanthe-pier', 'North Carolina', 'Outer Banks', 35.5939, -75.4656, 80, '41025'),
('Salvo', 'salvo', 'North Carolina', 'Outer Banks', 35.5447, -75.4711, 80, '41025'),
('Avon Pier', 'avon-pier', 'North Carolina', 'Outer Banks', 35.3528, -75.5050, 85, '41025'),
('Buxton', 'buxton', 'North Carolina', 'Outer Banks', 35.2675, -75.5350, 120, '41025'),
('Cape Hatteras Lighthouse', 'cape-hatteras-lighthouse', 'North Carolina', 'Outer Banks', 35.2508, -75.5286, 135, '41025'),
('Frisco Pier', 'frisco-pier', 'North Carolina', 'Outer Banks', 35.2372, -75.6197, 160, '41025'),
('Hatteras Village', 'hatteras-village', 'North Carolina', 'Outer Banks', 35.2194, -75.6903, 170, '41025'),

-- Outer Banks - Ocracoke
('Ocracoke', 'ocracoke', 'North Carolina', 'Outer Banks', 35.1147, -75.9819, 165, '41025'),

-- Crystal Coast / Southern OBX
('Emerald Isle', 'emerald-isle', 'North Carolina', 'Crystal Coast', 34.6603, -76.9508, 170, '41036'),
('Atlantic Beach', 'atlantic-beach-nc', 'North Carolina', 'Crystal Coast', 34.6997, -76.7403, 160, '41036'),
('Fort Macon', 'fort-macon', 'North Carolina', 'Crystal Coast', 34.6981, -76.6781, 150, '41036'),

-- Wilmington Area
('Topsail Beach', 'topsail-beach', 'North Carolina', 'Wilmington', 34.3578, -77.6297, 150, '41036'),
('Surf City', 'surf-city-nc', 'North Carolina', 'Wilmington', 34.4272, -77.5461, 145, '41036'),
('Wrightsville Beach', 'wrightsville-beach', 'North Carolina', 'Wilmington', 34.2086, -77.7964, 140, '41036'),
('Carolina Beach', 'carolina-beach', 'North Carolina', 'Wilmington', 34.0353, -77.8936, 145, '41036'),
('Kure Beach', 'kure-beach', 'North Carolina', 'Wilmington', 33.9969, -77.9072, 150, '41036')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  orientation = EXCLUDED.orientation,
  buoy_id = EXCLUDED.buoy_id;
