-- Buoy reassignment, Oct 27, 2026 (already applied)
--
-- Seven assigned buoys had no wave data. Six (41036, 44017, 44018, 44039,
-- 46223, 51203) no longer appear in NDBC's latest_obs at all, so they've been
-- retired or renumbered. 44009 still reports, but only wind (wave sensor dead).
--
-- Replacements are the nearest station that reports waves AND faces the same
-- water as the spot, picked from NDBC's latest_obs.txt. Mostly CDIP Waveriders.
-- Distances are spot to buoy.
--
--   41110 Masonboro Inlet NC     Wrightsville Beach (~10 km)
--   41159 Onslow Bay outer NC    Emerald Isle (~50 km)
--   44084 Bethany Beach DE       all 8 Delaware / Maryland spots (0-35 km)
--   44097 Block Island RI        Ditch Plains, Main Beach East Hampton
--   44025 Long Island offshore   Shinnecock Inlet (~90 km)
--   44085 south of Cuttyhunk MA  Cisco, Surfside (Nantucket south shore)
--   44098 Jeffreys Ledge NH      Marconi, Nauset, Coast Guard (outer Cape, ~110 km)
--                                 No live outer-Cape wave buoy exists. 44090 is
--                                 closer but sits inside Cape Cod Bay, the wrong
--                                 side of the Cape for east-facing beaches.
--   46277 Oceanside offshore CA  Lower Trestles (~8 km)
--   46285 Dana Point CA          Salt Creek (~5 km)
--   51201 Waimea Bay, Oahu       Jaws, Honolua Bay, Ho'okipa (~190 km)
--                                 No live Maui north-shore buoy. Waimea is the
--                                 standard NW-swell reference Maui surfers use.
--   (none)                       Long Beach CT. No Long Island Sound wave buoy
--                                 reports; an open-ocean buoy would overstate the
--                                 Sound, so the buoy is removed instead.

UPDATE spots SET buoy_id = m.new_buoy
FROM (VALUES
  ('Wrightsville Beach','41110'), ('Emerald Isle','41159'),
  ('Rehoboth Beach','44084'), ('Dewey Beach','44084'), ('Bethany Beach','44084'), ('Fenwick Island','44084'),
  ('Indian River Inlet','44084'), ('Assateague Island','44084'), ('Ocean City Inlet','44084'), ('Ocean City Pier','44084'),
  ('Ditch Plains','44097'), ('Main Beach East Hampton','44097'), ('Shinnecock Inlet','44025'),
  ('Cisco Beach','44085'), ('Surfside Beach','44085'),
  ('Marconi Beach','44098'), ('Nauset Beach','44098'), ('Coast Guard Beach','44098'),
  ('Lower Trestles','46277'), ('Salt Creek','46285'),
  ('Jaws','51201'), ('Honolua Bay','51201'), ('Ho''okipa','51201'),
  ('Long Beach CT', NULL)
) AS m(name, new_buoy)
WHERE spots.name = m.name
  AND spots.buoy_id IN ('41036','44009','44017','44018','44039','46223','51203');
