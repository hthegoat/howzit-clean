-- STEP 1: Delete excess spots from NY, NC, FL (keep the best ones)
-- Run this first

-- Delete excess New York spots (keep ~7 key spots)
DELETE FROM spots WHERE slug IN (
  'rockaway-90th',
  'lido-beach', 
  'point-lookout',
  'gilgo-beach',
  'fire-island',
  'smith-point',
  'cupsogue-beach',
  'ponquogue-beach',
  'flying-point',
  'mecox-beach',
  'sagaponack',
  'georgica-beach',
  'montauk-point'
);

-- Delete excess North Carolina spots (keep ~8 key spots)
DELETE FROM spots WHERE slug IN (
  'corolla',
  'duck-pier',
  'kitty-hawk-pier',
  'pea-island',
  'salvo',
  'avon-pier',
  'frisco-pier',
  'hatteras-village',
  'ocracoke',
  'atlantic-beach-nc',
  'fort-macon',
  'topsail-beach',
  'surf-city-nc',
  'carolina-beach',
  'kure-beach',
  'oregon-inlet',
  'rodanthe-pier',
  'buxton',
  'cape-hatteras-lighthouse'
);

-- Delete excess Florida spots (keep ~7 key spots)
DELETE FROM spots WHERE slug IN (
  'playalinda-beach',
  'ponce-inlet',
  'daytona-beach',
  'flagler-beach-pier',
  'juno-beach-pier',
  'lake-worth-pier',
  'deerfield-beach-pier',
  'pompano-beach-pier',
  'fort-lauderdale',
  'panama-city-beach',
  'clearwater-beach'
);
