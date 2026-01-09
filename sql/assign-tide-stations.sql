-- Assign tide stations to spots missing them
-- NOAA CO-OPS station IDs: https://tidesandcurrents.noaa.gov/

-- New York spots (use Montauk 8510560 for east end, Sandy Hook 8531680 for west)
UPDATE spots SET tide_station_id = '8510560' WHERE slug IN (
  'shinnecock-inlet',
  'main-beach-east-hampton',
  'ditch-plains',
  'montauk-point'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8531680' WHERE state = 'New York' AND tide_station_id IS NULL;

-- North Carolina (use Duck Pier 8651370 for northern OBX, Wrightsville 8658163 for southern)
UPDATE spots SET tide_station_id = '8651370' WHERE slug IN (
  'kill-devil-hills',
  'nags-head-pier',
  'jennettes-pier'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8658163' WHERE slug IN (
  'wrightsville-beach',
  'emerald-isle'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8651370' WHERE state = 'North Carolina' AND tide_station_id IS NULL;

-- Florida (use different stations by region)
UPDATE spots SET tide_station_id = '8720218' WHERE slug IN (
  'jacksonville-beach-pier',
  'st-augustine-beach'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8721604' WHERE slug IN (
  'new-smyrna-inlet',
  'daytona-beach',
  'cocoa-beach-pier',
  'sebastian-inlet',
  'playalinda-beach'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8722670' WHERE slug IN (
  'south-beach-miami',
  'fort-lauderdale',
  'pompano-beach-pier',
  'deerfield-beach-pier',
  'juno-beach-pier',
  'lake-worth-pier'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8729840' WHERE slug IN (
  'pensacola-beach',
  'panama-city-beach'
) AND tide_station_id IS NULL;

UPDATE spots SET tide_station_id = '8726520' WHERE slug = 'clearwater-beach' AND tide_station_id IS NULL;

-- New England
UPDATE spots SET tide_station_id = '8443970' WHERE state = 'Massachusetts' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8452660' WHERE state = 'Rhode Island' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8461490' WHERE state = 'Connecticut' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8423898' WHERE state = 'New Hampshire' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8418150' WHERE state = 'Maine' AND tide_station_id IS NULL;

-- Mid-Atlantic
UPDATE spots SET tide_station_id = '8534720' WHERE state = 'Delaware' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8570283' WHERE state = 'Maryland' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8638863' WHERE state = 'Virginia' AND tide_station_id IS NULL;

-- Southeast
UPDATE spots SET tide_station_id = '8661070' WHERE state = 'South Carolina' AND tide_station_id IS NULL;
UPDATE spots SET tide_station_id = '8670870' WHERE state = 'Georgia' AND tide_station_id IS NULL;

-- Verify results
SELECT state, COUNT(*) as total, 
       COUNT(tide_station_id) as with_tide_station,
       COUNT(*) - COUNT(tide_station_id) as missing
FROM spots 
GROUP BY state 
ORDER BY state;
