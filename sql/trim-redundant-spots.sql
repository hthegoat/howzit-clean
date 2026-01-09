-- Trim Redundant Spots
-- Run this in Supabase SQL Editor
-- Reduces ~81 spots to ~53 spots by removing redundant/lesser-known spots

-- Connecticut (4 → 2)
-- Remove: Westport Beach (too sheltered), Misquamicut (actually in RI)
DELETE FROM spots WHERE slug IN ('westport-beach', 'misquamicut');

-- Maine (5 → 3)
-- Remove: Scarborough Beach (redundant with Higgins), Gooch Beach (lesser known)
DELETE FROM spots WHERE slug IN ('scarborough-beach', 'gooch-beach');

-- Maryland (5 → 3)
-- Remove: Ocean City 40th St, Ocean City 120th St (same beach, different streets)
DELETE FROM spots WHERE slug IN ('ocean-city-40th', 'ocean-city-120th');

-- Virginia (5 → 3)
-- Remove: Virginia Beach 1st Street (redundant), Chincoteague (rarely surfed)
DELETE FROM spots WHERE slug IN ('virginia-beach-1st', 'chincoteague');

-- New York (20 → 14)
-- Remove: Rockaway 90th, Lido Beach, Smith Point, Cupsogue Beach, Flying Point, Mecox Beach, Georgica Beach
DELETE FROM spots WHERE slug IN (
  'rockaway-90th',
  'lido-beach',
  'smith-point',
  'cupsogue-beach',
  'flying-point',
  'mecox-beach',
  'georgica-beach'
);

-- Florida (18 → 12)
-- Remove: Playalinda, Daytona, Flagler, St Augustine, Deerfield, Pompano, Fort Lauderdale, Clearwater
DELETE FROM spots WHERE slug IN (
  'playalinda-beach',
  'daytona-beach',
  'flagler-beach-pier',
  'st-augustine-beach',
  'deerfield-beach-pier',
  'pompano-beach-pier',
  'fort-lauderdale',
  'clearwater-beach'
);

-- North Carolina (24 → 16)
-- Remove: Duck Pier, Nags Head Pier, Oregon Inlet, Pea Island, Salvo, Frisco Pier, Hatteras Village, Fort Macon, Topsail, Surf City, Kure Beach
DELETE FROM spots WHERE slug IN (
  'duck-pier',
  'nags-head-pier',
  'oregon-inlet',
  'pea-island',
  'salvo',
  'frisco-pier',
  'hatteras-village',
  'fort-macon',
  'topsail-beach',
  'surf-city-nc',
  'kure-beach'
);

-- Verify the cleanup
SELECT state, COUNT(*) as spot_count 
FROM spots 
GROUP BY state 
ORDER BY state;
