import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BuoyReading {
  buoy_id: string;
  timestamp: string;
  wave_height: number | null;
  dominant_period: number | null;
  average_period: number | null;
  wave_direction: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gust: number | null;
  water_temp: number | null;
  air_temp: number | null;
  pressure: number | null;
  swell_height: number | null;
  swell_period: number | null;
  swell_direction: number | null;
  wind_wave_height: number | null;
  wind_wave_period: number | null;
  wind_wave_direction: number | null;
  fetched_at: string;
}

// Parse NDBC realtime data (standard meteorological)
function parseNDBCRealtime(text: string, buoyId: string): BuoyReading | null {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return null;
  
  // First line is headers, second is units, data starts at line 3
  const headers = lines[0].split(/\s+/);
  const dataLine = lines[2]; // Most recent reading
  const values = dataLine.split(/\s+/);
  
  const getValue = (name: string): number | null => {
    const idx = headers.indexOf(name);
    if (idx === -1) return null;
    const val = parseFloat(values[idx]);
    return isNaN(val) || val === 99 || val === 999 || val === 9999 ? null : val;
  };
  
  // Parse timestamp (YY MM DD hh mm)
  const year = 2000 + parseInt(values[0]);
  const month = parseInt(values[1]) - 1;
  const day = parseInt(values[2]);
  const hour = parseInt(values[3]);
  const minute = parseInt(values[4]);
  const timestamp = new Date(Date.UTC(year, month, day, hour, minute));
  
  return {
    buoy_id: buoyId,
    timestamp: timestamp.toISOString(),
    wave_height: getValue('WVHT'),  // meters
    dominant_period: getValue('DPD'),  // seconds
    average_period: getValue('APD'),  // seconds
    wave_direction: getValue('MWD'),  // degrees
    wind_speed: getValue('WSPD'),  // m/s
    wind_direction: getValue('WDIR'),  // degrees
    wind_gust: getValue('GST'),  // m/s
    water_temp: getValue('WTMP'),  // Celsius
    air_temp: getValue('ATMP'),  // Celsius
    pressure: getValue('PRES'),  // hPa
    swell_height: null,
    swell_period: null,
    swell_direction: null,
    wind_wave_height: null,
    wind_wave_period: null,
    wind_wave_direction: null,
    fetched_at: new Date().toISOString()
  };
}

// Parse NDBC spectral wave summary data (.spec file)
// This is available for most buoys and contains swell/wind wave separation
function parseNDBCSpec(text: string): { 
  waveHeight: number | null;
  dominantPeriod: number | null;
  swellHeight: number | null; 
  swellPeriod: number | null; 
  swellDir: number | null; 
  windWaveHeight: number | null; 
  windWavePeriod: number | null; 
  windWaveDir: number | null;
  timestamp: Date | null;
} | null {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return null;
  
  const headers = lines[0].split(/\s+/);
  const dataLine = lines[2];
  const values = dataLine.split(/\s+/);
  
  const getValue = (name: string): number | null => {
    const idx = headers.indexOf(name);
    if (idx === -1) return null;
    const val = parseFloat(values[idx]);
    return isNaN(val) || val === 99 || val === 999 ? null : val;
  };
  
  // Parse timestamp from spec file (YY MM DD hh mm)
  let timestamp: Date | null = null;
  try {
    const year = 2000 + parseInt(values[0]);
    const month = parseInt(values[1]) - 1;
    const day = parseInt(values[2]);
    const hour = parseInt(values[3]);
    const minute = parseInt(values[4]);
    timestamp = new Date(Date.UTC(year, month, day, hour, minute));
  } catch (e) {
    // Ignore timestamp parse errors
  }
  
  // Convert direction string to degrees
  const dirToDeg = (dir: string): number | null => {
    const dirs: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return dirs[dir] ?? null;
  };
  
  const swellDirIdx = headers.indexOf('SwD');
  const windWaveDirIdx = headers.indexOf('WWD');
  
  return {
    waveHeight: getValue('WVHT'),
    dominantPeriod: getValue('DPD'),
    swellHeight: getValue('SwH'),
    swellPeriod: getValue('SwP'),
    swellDir: swellDirIdx !== -1 && values[swellDirIdx] ? dirToDeg(values[swellDirIdx]) : null,
    windWaveHeight: getValue('WWH'),
    windWavePeriod: getValue('WWP'),
    windWaveDir: windWaveDirIdx !== -1 && values[windWaveDirIdx] ? dirToDeg(values[windWaveDirIdx]) : null,
    timestamp
  };
}

async function fetchBuoyData(buoyId: string): Promise<BuoyReading | null> {
  try {
    let reading: BuoyReading | null = null;
    let hasWaveData = false;
    
    // Try spectral data FIRST - this has the best wave info (swell/wind wave separation)
    // Works for Waverider buoys and standard buoys
    try {
      const specUrl = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.spec`;
      const specRes = await fetch(specUrl);
      
      if (specRes.ok) {
        const specText = await specRes.text();
        const specData = parseNDBCSpec(specText);
        
        if (specData && specData.timestamp) {
          reading = {
            buoy_id: buoyId,
            timestamp: specData.timestamp.toISOString(),
            wave_height: specData.waveHeight,
            dominant_period: specData.dominantPeriod,
            average_period: null,
            wave_direction: null,
            wind_speed: null,
            wind_direction: null,
            wind_gust: null,
            water_temp: null,
            air_temp: null,
            pressure: null,
            swell_height: specData.swellHeight,
            swell_period: specData.swellPeriod,
            swell_direction: specData.swellDir,
            wind_wave_height: specData.windWaveHeight,
            wind_wave_period: specData.windWavePeriod,
            wind_wave_direction: specData.windWaveDir,
            fetched_at: new Date().toISOString()
          };
          hasWaveData = specData.waveHeight != null;
        }
      }
    } catch (e) {
      console.log(`No spectral data for buoy ${buoyId}`);
    }
    
    // Try standard meteorological data for wind/temp (and wave if we don't have it yet)
    try {
      const meteoUrl = `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`;
      const meteoRes = await fetch(meteoUrl);
      
      if (meteoRes.ok) {
        const meteoText = await meteoRes.text();
        const meteoReading = parseNDBCRealtime(meteoText, buoyId);
        
        if (meteoReading) {
          if (!reading) {
            // No spec data, use meteo as base
            reading = meteoReading;
          } else {
            // Merge meteo data into existing reading (add wind/temp)
            reading.wind_speed = meteoReading.wind_speed;
            reading.wind_direction = meteoReading.wind_direction;
            reading.wind_gust = meteoReading.wind_gust;
            reading.water_temp = meteoReading.water_temp;
            reading.air_temp = meteoReading.air_temp;
            reading.pressure = meteoReading.pressure;
            reading.average_period = meteoReading.average_period;
            reading.wave_direction = meteoReading.wave_direction;
            
            // If spec didn't have wave height, use meteo
            if (!hasWaveData && meteoReading.wave_height != null) {
              reading.wave_height = meteoReading.wave_height;
              reading.dominant_period = meteoReading.dominant_period;
            }
          }
        }
      }
    } catch (e) {
      console.log(`No meteo data for buoy ${buoyId}`);
    }
    
    return reading;
  } catch (e) {
    console.error(`Error fetching buoy ${buoyId}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get unique buoy IDs from spots
    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("buoy_id")
      .not("buoy_id", "is", null);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);
    
    const buoyIds = [...new Set(spots?.map(s => s.buoy_id).filter(Boolean))] as string[];
    
    if (!buoyIds.length) {
      return new Response(JSON.stringify({ message: "No buoys configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const results = { processed: 0, saved: 0, errors: [] as string[] };

    for (const buoyId of buoyIds) {
      try {
        const reading = await fetchBuoyData(buoyId);
        
        if (reading) {
          // Check if reading is recent (within last 3 hours)
          const readingTime = new Date(reading.timestamp).getTime();
          const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
          
          if (readingTime < threeHoursAgo) {
            results.errors.push(`${buoyId}: Data stale (${reading.timestamp})`);
            continue;
          }
          
          const { error: upsertError } = await supabase
            .from("buoy_readings")
            .upsert(reading, { onConflict: "buoy_id,timestamp" });

          if (upsertError) {
            results.errors.push(`${buoyId}: ${upsertError.message}`);
          } else {
            results.saved++;
          }
        } else {
          results.errors.push(`${buoyId}: No data returned`);
        }
        
        results.processed++;
        
        // Rate limit
        await new Promise(r => setTimeout(r, 200));
        
      } catch (e) {
        results.errors.push(`${buoyId}: ${e instanceof Error ? e.message : "Error"}`);
      }
    }

    return new Response(JSON.stringify({ message: "Complete", ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
