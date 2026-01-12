// Comparison test: WaveWatch III vs Open-Meteo for Deal, NJ
// Run with: node test-comparison.js

const testComparison = async () => {
  // Deal, NJ coordinates (approximate)
  const lat = 40.25;
  const lon = -73.99;
  
  // ERDDAP uses 0-360 longitude
  const erddapLon = lon < 0 ? 360 + lon : lon;
  const gridLat = Math.round(lat * 2) / 2;
  const gridLon = Math.round(erddapLon * 2) / 2;
  
  console.log('=== DEAL, NJ FORECAST COMPARISON ===');
  console.log(`Coordinates: ${lat}, ${lon}`);
  console.log(`WW3 Grid Point: ${gridLat}, ${gridLon}`);
  console.log('');
  
  // Fetch WaveWatch III
  console.log('Fetching WaveWatch III...');
  const now = new Date();
  const startTime = now.toISOString();
  
  const ww3Url = `https://coastwatch.pfeg.noaa.gov/erddap/griddap/NWW3_Global_Best.json?` +
    `Thgt[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `Tper[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `Tdir[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `shgt[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `sper[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `sdir[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})]`;
  
  let ww3Data = [];
  try {
    const ww3Res = await fetch(ww3Url);
    if (ww3Res.ok) {
      const ww3Json = await ww3Res.json();
      ww3Data = ww3Json.table.rows.map(row => {
        const timeVal = typeof row[0] === 'number' ? row[0] * 1000 : Date.parse(row[0]);
        return {
        time: new Date(timeVal),
        source: 'WW3',
        waveHeight: row[4],  // Thgt in meters
        period: row[5],      // Tper
        direction: row[6],   // Tdir
        swellHeight: row[7], // shgt
        swellPeriod: row[8], // sper
        swellDir: row[9]     // sdir
      }});
      console.log(`  Got ${ww3Data.length} hours of WW3 data`);
    } else {
      console.log('  WW3 fetch failed:', await ww3Res.text());
    }
  } catch (e) {
    console.log('  WW3 error:', e.message);
  }
  
  // Fetch Open-Meteo
  console.log('Fetching Open-Meteo...');
  const omUrl = `https://marine-api.open-meteo.com/v1/marine?` +
    `latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction` +
    `&timezone=UTC`;
  
  let omData = [];
  try {
    const omRes = await fetch(omUrl);
    if (omRes.ok) {
      const omJson = await omRes.json();
      const hourly = omJson.hourly;
      omData = hourly.time.map((t, i) => ({
        time: new Date(t),
        source: 'OpenMeteo',
        waveHeight: hourly.wave_height[i],
        period: hourly.wave_period[i],
        direction: hourly.wave_direction[i],
        swellHeight: hourly.swell_wave_height[i],
        swellPeriod: hourly.swell_wave_period[i],
        swellDir: hourly.swell_wave_direction[i]
      }));
      console.log(`  Got ${omData.length} hours of Open-Meteo data`);
    }
  } catch (e) {
    console.log('  Open-Meteo error:', e.message);
  }
  
  // Build comparison data - match by hour
  console.log('');
  console.log('=== HOURLY COMPARISON (next 48 hours) ===');
  console.log('Time                  | WW3 Height | OM Height  | WW3 Period | OM Period  | WW3 Dir | OM Dir');
  console.log('-'.repeat(100));
  
  const comparisonData = [];
  
  for (let i = 0; i < Math.min(48, ww3Data.length); i++) {
    const ww3 = ww3Data[i];
    if (!ww3) continue;
    
    // Find matching Open-Meteo hour
    const om = omData.find(o => 
      o.time.getTime() >= ww3.time.getTime() - 30*60*1000 && 
      o.time.getTime() <= ww3.time.getTime() + 30*60*1000
    );
    
    const ww3Ht = ww3.waveHeight ? (ww3.waveHeight * 3.281).toFixed(1) + 'ft' : '  --  ';
    const omHt = om?.waveHeight ? (om.waveHeight * 3.281).toFixed(1) + 'ft' : '  --  ';
    const ww3Per = ww3.period ? ww3.period.toFixed(1) + 's' : ' -- ';
    const omPer = om?.period ? om.period.toFixed(1) + 's' : ' -- ';
    const ww3Dir = ww3.direction ? ww3.direction.toFixed(0) + '°' : ' -- ';
    const omDir = om?.direction ? om.direction.toFixed(0) + '°' : ' -- ';
    
    const timeStr = ww3.time.toISOString().replace('T', ' ').slice(0, 16);
    console.log(`${timeStr} | ${ww3Ht.padStart(10)} | ${omHt.padStart(10)} | ${ww3Per.padStart(10)} | ${omPer.padStart(10)} | ${ww3Dir.padStart(7)} | ${omDir.padStart(6)}`);
    
    comparisonData.push({
      time: ww3.time,
      ww3Height: ww3.waveHeight,
      omHeight: om?.waveHeight,
      ww3Period: ww3.period,
      omPeriod: om?.period,
      ww3Dir: ww3.direction,
      omDir: om?.direction
    });
  }
  
  // Calculate average difference
  const validPairs = comparisonData.filter(d => d.ww3Height && d.omHeight);
  if (validPairs.length > 0) {
    const avgDiff = validPairs.reduce((sum, d) => sum + Math.abs(d.ww3Height - d.omHeight), 0) / validPairs.length;
    const avgDiffFt = (avgDiff * 3.281).toFixed(2);
    console.log('');
    console.log(`Average height difference: ${avgDiffFt}ft (${avgDiff.toFixed(3)}m)`);
    
    // Who's higher on average?
    const ww3Avg = validPairs.reduce((s, d) => s + d.ww3Height, 0) / validPairs.length;
    const omAvg = validPairs.reduce((s, d) => s + d.omHeight, 0) / validPairs.length;
    console.log(`WW3 average: ${(ww3Avg * 3.281).toFixed(2)}ft | Open-Meteo average: ${(omAvg * 3.281).toFixed(2)}ft`);
  }
  
  // Output JSON for graphing
  const fs = await import('fs');
  fs.writeFileSync('comparison-data.json', JSON.stringify(comparisonData, null, 2));
  console.log('');
  console.log('Saved comparison-data.json for graphing');
};

testComparison();
