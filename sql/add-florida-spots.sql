-- Florida Surf Spots
-- Run this in Supabase SQL Editor

INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
-- East Coast Florida (Atlantic) - Best surf in FL
('Sebastian Inlet', 'sebastian-inlet', 'Florida', 'Space Coast', 27.8561, -80.4481, 75, '41113'),
('Cocoa Beach Pier', 'cocoa-beach-pier', 'Florida', 'Space Coast', 28.3653, -80.6069, 90, '41113'),
('Playalinda Beach', 'playalinda-beach', 'Florida', 'Space Coast', 28.6817, -80.6556, 80, '41113'),
('New Smyrna Beach Inlet', 'new-smyrna-inlet', 'Florida', 'Volusia County', 29.0750, -80.9164, 85, '41113'),
('Ponce Inlet', 'ponce-inlet', 'Florida', 'Volusia County', 29.0836, -80.9206, 90, '41113'),
('Daytona Beach', 'daytona-beach', 'Florida', 'Volusia County', 29.2108, -81.0228, 85, '41113'),
('Flagler Beach Pier', 'flagler-beach-pier', 'Florida', 'Flagler County', 29.4747, -81.1261, 80, '41113'),
('St. Augustine Beach', 'st-augustine-beach', 'Florida', 'St. Johns County', 29.8614, -81.2683, 75, '41112'),
('Jacksonville Beach Pier', 'jacksonville-beach-pier', 'Florida', 'Duval County', 30.2947, -81.3931, 80, '41112'),
('Juno Beach Pier', 'juno-beach-pier', 'Florida', 'Palm Beach County', 26.8795, -80.0534, 85, '41114'),
('Lake Worth Pier', 'lake-worth-pier', 'Florida', 'Palm Beach County', 26.6131, -80.0336, 90, '41114'),
('Deerfield Beach Pier', 'deerfield-beach-pier', 'Florida', 'Broward County', 26.3184, -80.0739, 90, '41114'),
('Pompano Beach Pier', 'pompano-beach-pier', 'Florida', 'Broward County', 26.2378, -80.0836, 90, '41114'),
('Fort Lauderdale', 'fort-lauderdale', 'Florida', 'Broward County', 26.1003, -80.1028, 95, '41114'),
('South Beach (Miami)', 'south-beach-miami', 'Florida', 'Miami-Dade County', 25.7825, -80.1278, 100, '41114'),

-- Gulf Coast Florida (less consistent but gets hurricane swells)
('Pensacola Beach', 'pensacola-beach', 'Florida', 'Gulf Coast', 30.3269, -87.1428, 180, '42012'),
('Panama City Beach', 'panama-city-beach', 'Florida', 'Gulf Coast', 30.1766, -85.8055, 180, '42012'),
('Clearwater Beach', 'clearwater-beach', 'Florida', 'Gulf Coast', 27.9778, -82.8269, 270, '42036')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  orientation = EXCLUDED.orientation,
  buoy_id = EXCLUDED.buoy_id;

-- After running this, trigger the forecast ingestion to fetch data for new spots
