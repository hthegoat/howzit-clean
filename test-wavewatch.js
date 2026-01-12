// Test script for WaveWatch III ERDDAP API
// Run with: node test-wavewatch.js

const testWaveWatch = async () => {
  // Asbury Park, NJ coordinates
  const lat = 40.22;
  const lon = -73.99;
  
  // ERDDAP uses 0-360 longitude, so convert negative to positive
  const erddapLon = lon < 0 ? 360 + lon : lon;
  
  // Round to nearest 0.5 (WW3 grid resolution)
  const gridLat = Math.round(lat * 2) / 2;
  const gridLon = Math.round(erddapLon * 2) / 2;
  
  console.log(`Querying WaveWatch III for lat=${gridLat}, lon=${gridLon}`);
  console.log(`Original coords: ${lat}, ${lon}`);
  console.log('');
  
  // Variables need separate dimension specifications
  // Thgt = significant wave height (total)
  // Tper = peak wave period (total)
  // Tdir = peak wave direction (total)
  // shgt = swell significant height
  // sper = swell peak period
  // sdir = swell direction
  // whgt = wind wave height
  // wper = wind wave period
  // wdir = wind wave direction
  
  const baseUrl = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/NWW3_Global_Best.json';
  
  // Calculate time range - now to end of available forecast
  const now = new Date();
  const startTime = now.toISOString();
  
  // Build dimension constraints - use 'last' for end time since forecast extent varies
  const dims = `[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})]`;
  
  // Each variable with its dimensions
  const url = `${baseUrl}?Thgt${dims},Tper${dims},Tdir${dims},shgt${dims},sper${dims},sdir${dims},whgt${dims},wper${dims},wdir${dims}`;
  
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error:', response.status, text);
      return;
    }
    
    const data = await response.json();
    
    console.log('Column names:', data.table.columnNames);
    console.log('Column units:', data.table.columnUnits);
    console.log('');
    console.log('Sample rows (first 10):');
    
    // Parse the data
    const rows = data.table.rows;
    rows.slice(0, 10).forEach(row => {
      const [time, depth, lat, lon, Thgt, Tper, Tdir, shgt, sper, sdir, whgt, wper, wdir] = row;
      // Time is in seconds since 1970, convert to ms for Date
      const timeMs = typeof time === 'number' ? time * 1000 : Date.parse(time);
      console.log({
        time: new Date(timeMs).toISOString(),
        waveHeight_m: Thgt?.toFixed(2),
        waveHeight_ft: Thgt ? (Thgt * 3.281).toFixed(1) : null,
        period_s: Tper?.toFixed(1),
        direction: Tdir?.toFixed(0),
        swellHeight_m: shgt?.toFixed(2),
        swellPeriod_s: sper?.toFixed(1),
        swellDir: sdir?.toFixed(0),
        windWaveHeight_m: whgt?.toFixed(2),
        windWavePeriod_s: wper?.toFixed(1),
        windWaveDir: wdir?.toFixed(0)
      });
    });
    
    console.log('');
    console.log(`Total forecast hours: ${rows.length}`);
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

testWaveWatch();
