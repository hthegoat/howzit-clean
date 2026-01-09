-- STEP 2: Add spots for other East Coast states
-- Run this after cleanup

-- Maine (5 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Higgins Beach', 'higgins-beach', 'Maine', 'Southern Maine', 43.5647, -70.2317, 120, '44007'),
('Scarborough Beach', 'scarborough-beach', 'Maine', 'Southern Maine', 43.5542, -70.3208, 110, '44007'),
('Old Orchard Beach', 'old-orchard-beach', 'Maine', 'Southern Maine', 43.5175, -70.3775, 100, '44007'),
('Fortunes Rocks', 'fortunes-rocks', 'Maine', 'Southern Maine', 43.4403, -70.3756, 110, '44007'),
('Gooch Beach', 'gooch-beach', 'Maine', 'Southern Maine', 43.3475, -70.4786, 100, '44007')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- New Hampshire (3 spots - small coastline)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Hampton Beach', 'hampton-beach', 'New Hampshire', 'Seacoast', 42.9072, -70.8106, 95, '44007'),
('Jenness Beach', 'jenness-beach', 'New Hampshire', 'Seacoast', 43.0239, -70.7617, 100, '44007'),
('Rye Beach', 'rye-beach', 'New Hampshire', 'Seacoast', 43.0028, -70.7514, 95, '44007')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Massachusetts (7 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Nantasket Beach', 'nantasket-beach', 'Massachusetts', 'South Shore', 42.2753, -70.8619, 90, '44013'),
('Duxbury Beach', 'duxbury-beach', 'Massachusetts', 'South Shore', 42.0628, -70.6347, 80, '44013'),
('Coast Guard Beach', 'coast-guard-beach', 'Massachusetts', 'Cape Cod', 41.8603, -69.9508, 75, '44018'),
('Nauset Beach', 'nauset-beach', 'Massachusetts', 'Cape Cod', 41.7894, -69.9419, 80, '44018'),
('Marconi Beach', 'marconi-beach', 'Massachusetts', 'Cape Cod', 41.8889, -69.9614, 85, '44018'),
('Cisco Beach', 'cisco-beach', 'Massachusetts', 'Nantucket', 41.2544, -70.1142, 180, '44018'),
('Surfside Beach', 'surfside-beach-ma', 'Massachusetts', 'Nantucket', 41.2567, -70.0992, 175, '44018')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Rhode Island (5 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Narragansett Beach', 'narragansett-beach', 'Rhode Island', 'South County', 41.4317, -71.4558, 150, '44097'),
('Point Judith', 'point-judith', 'Rhode Island', 'South County', 41.3614, -71.4808, 170, '44097'),
('Matunuck Beach', 'matunuck-beach', 'Rhode Island', 'South County', 41.3833, -71.5250, 165, '44097'),
('Ruggles', 'ruggles', 'Rhode Island', 'Newport', 41.4786, -71.2986, 145, '44097'),
('Second Beach', 'second-beach-ri', 'Rhode Island', 'Newport', 41.5089, -71.2819, 150, '44097')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Connecticut (4 spots - limited surf)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Westport Beach', 'westport-beach', 'Connecticut', 'Fairfield County', 41.1178, -73.3486, 180, '44097'),
('Silver Sands', 'silver-sands', 'Connecticut', 'New Haven County', 41.2042, -72.9692, 175, '44097'),
('East Beach', 'east-beach-ct', 'Connecticut', 'New London County', 41.3228, -72.0008, 160, '44097'),
('Misquamicut', 'misquamicut', 'Connecticut', 'New London County', 41.3308, -71.8339, 165, '44097')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Delaware (4 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Rehoboth Beach', 'rehoboth-beach', 'Delaware', 'Sussex County', 38.7169, -75.0761, 95, '44009'),
('Dewey Beach', 'dewey-beach', 'Delaware', 'Sussex County', 38.6897, -75.0753, 90, '44009'),
('Bethany Beach', 'bethany-beach', 'Delaware', 'Sussex County', 38.5394, -75.0558, 85, '44009'),
('Fenwick Island', 'fenwick-island', 'Delaware', 'Sussex County', 38.4656, -75.0519, 85, '44009')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Maryland (5 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Ocean City Inlet', 'ocean-city-inlet', 'Maryland', 'Ocean City', 38.3264, -75.0847, 90, '44009'),
('Ocean City Pier', 'ocean-city-pier', 'Maryland', 'Ocean City', 38.3367, -75.0833, 85, '44009'),
('Ocean City 40th St', 'ocean-city-40th', 'Maryland', 'Ocean City', 38.3567, -75.0778, 85, '44009'),
('Ocean City 120th St', 'ocean-city-120th', 'Maryland', 'Ocean City', 38.4264, -75.0589, 80, '44009'),
('Assateague Island', 'assateague-island', 'Maryland', 'Worcester County', 38.2500, -75.1167, 95, '44009')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Virginia (5 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Virginia Beach Oceanfront', 'virginia-beach-oceanfront', 'Virginia', 'Virginia Beach', 36.8529, -75.9774, 80, '44014'),
('Virginia Beach 1st Street', 'virginia-beach-1st', 'Virginia', 'Virginia Beach', 36.8438, -75.9769, 85, '44014'),
('Croatan Beach', 'croatan-beach', 'Virginia', 'Virginia Beach', 36.8183, -75.9689, 90, '44014'),
('Sandbridge', 'sandbridge', 'Virginia', 'Virginia Beach', 36.7214, -75.9311, 85, '44014'),
('Chincoteague', 'chincoteague', 'Virginia', 'Eastern Shore', 37.9328, -75.3778, 95, '44009')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- South Carolina (6 spots)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Cherry Grove Pier', 'cherry-grove-pier', 'South Carolina', 'Grand Strand', 33.8272, -78.6319, 130, '41013'),
('Myrtle Beach', 'myrtle-beach', 'South Carolina', 'Grand Strand', 33.6891, -78.8867, 120, '41013'),
('Surfside Beach SC', 'surfside-beach-sc', 'South Carolina', 'Grand Strand', 33.6061, -78.9753, 115, '41013'),
('Pawleys Island', 'pawleys-island', 'South Carolina', 'Grand Strand', 33.4294, -79.1231, 110, '41013'),
('Folly Beach', 'folly-beach', 'South Carolina', 'Charleston', 32.6550, -79.9403, 135, '41013'),
('Isle of Palms', 'isle-of-palms', 'South Carolina', 'Charleston', 32.7872, -79.7733, 120, '41013')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;

-- Georgia (4 spots - limited coastline)
INSERT INTO spots (name, slug, state, region, latitude, longitude, orientation, buoy_id) VALUES
('Tybee Island', 'tybee-island', 'Georgia', 'Savannah', 31.9961, -80.8456, 110, '41008'),
('St Simons Island', 'st-simons-island', 'Georgia', 'Golden Isles', 31.1411, -81.3903, 100, '41008'),
('Jekyll Island', 'jekyll-island', 'Georgia', 'Golden Isles', 31.0550, -81.4103, 95, '41008'),
('Cumberland Island', 'cumberland-island', 'Georgia', 'Golden Isles', 30.8500, -81.4500, 90, '41008')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, orientation = EXCLUDED.orientation, buoy_id = EXCLUDED.buoy_id;
