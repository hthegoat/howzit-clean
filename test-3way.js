// Test script for 3-way comparison: WaveWatch III vs Open-Meteo vs ECMWF
// Run with: node test-3way.js

const test3Way = async () => {
  // Deal, NJ coordinates
  const lat = 40.25;
  const lon = -73.99;
  
  // ERDDAP uses 0-360 longitude
  const erddapLon = lon < 0 ? 360 + lon : lon;
  const gridLat = Math.round(lat * 2) / 2;
  const gridLon = Math.round(erddapLon * 2) / 2;
  
  console.log('=== 3-WAY FORECAST COMPARISON: DEAL, NJ ===');
  console.log(`Coordinates: ${lat}, ${lon}`);
  console.log('');
  
  const results = {
    ww3: [],
    openMeteo: [],
    ecmwf: []
  };
  
  // 1. Fetch WaveWatch III
  console.log('1. Fetching WaveWatch III (NOAA)...');
  const now = new Date();
  const startTime = now.toISOString();
  
  const ww3Url = `https://coastwatch.pfeg.noaa.gov/erddap/griddap/NWW3_Global_Best.json?` +
    `Thgt[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `Tper[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})],` +
    `Tdir[(${startTime}):1:(last)][(0.0):1:(0.0)][(${gridLat}):1:(${gridLat})][(${gridLon}):1:(${gridLon})]`;
  
  try {
    const ww3Res = await fetch(ww3Url);
    if (ww3Res.ok) {
      const ww3Json = await ww3Res.json();
      results.ww3 = ww3Json.table.rows.map(row => {
        const timeVal = typeof row[0] === 'number' ? row[0] * 1000 : Date.parse(row[0]);
        return {
          time: new Date(timeVal),
          height: row[4],
          period: row[5],
          direction: row[6]
        };
      });
      console.log(`   Got ${results.ww3.length} hours`);
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  // 2. Fetch Open-Meteo (default/best mix model)
  console.log('2. Fetching Open-Meteo (default model mix)...');
  const omUrl = `https://marine-api.open-meteo.com/v1/marine?` +
    `latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,wave_direction` +
    `&timezone=UTC`;
  
  try {
    const omRes = await fetch(omUrl);
    if (omRes.ok) {
      const omJson = await omRes.json();
      const hourly = omJson.hourly;
      results.openMeteo = hourly.time.map((t, i) => ({
        time: new Date(t),
        height: hourly.wave_height[i],
        period: hourly.wave_period[i],
        direction: hourly.wave_direction[i]
      }));
      console.log(`   Got ${results.openMeteo.length} hours`);
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  // 3. Fetch ECMWF WAM via Open-Meteo
  console.log('3. Fetching ECMWF WAM (via Open-Meteo)...');
  const ecmwfUrl = `https://marine-api.open-meteo.com/v1/marine?` +
    `latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,wave_direction` +
    `&models=ecmwf_wam025` +
    `&timezone=UTC`;
  
  try {
    const ecRes = await fetch(ecmwfUrl);
    if (ecRes.ok) {
      const ecJson = await ecRes.json();
      const hourly = ecJson.hourly;
      results.ecmwf = hourly.time.map((t, i) => ({
        time: new Date(t),
        height: hourly.wave_height[i],
        period: hourly.wave_period[i],
        direction: hourly.wave_direction[i]
      }));
      console.log(`   Got ${results.ecmwf.length} hours`);
    } else {
      const errText = await ecRes.text();
      console.log('   ECMWF error:', errText.slice(0, 200));
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  // Print comparison table
  console.log('');
  console.log('=== HOURLY COMPARISON (next 48 hours) ===');
  console.log('Time              | WW3 Ht  | OM Ht   | ECMWF Ht | WW3 Per | OM Per  | ECMWF Per');
  console.log('-'.repeat(95));
  
  for (let i = 0; i < Math.min(48, results.ww3.length); i++) {
    const ww3 = results.ww3[i];
    if (!ww3) continue;
    
    // Find matching times from other sources
    const om = results.openMeteo.find(o => 
      Math.abs(o.time.getTime() - ww3.time.getTime()) < 30 * 60 * 1000
    );
    const ec = results.ecmwf.find(e => 
      Math.abs(e.time.getTime() - ww3.time.getTime()) < 30 * 60 * 1000
    );
    
    const fmt = (v, unit) => v != null ? (v * (unit === 'ft' ? 3.281 : 1)).toFixed(1) + (unit || '') : '  --  ';
    
    const timeStr = ww3.time.toISOString().slice(5, 16).replace('T', ' ');
    console.log(
      `${timeStr} | ${fmt(ww3.height, 'ft').padStart(7)} | ${fmt(om?.height, 'ft').padStart(7)} | ${fmt(ec?.height, 'ft').padStart(8)} | ` +
      `${fmt(ww3.period, 's').padStart(7)} | ${fmt(om?.period, 's').padStart(7)} | ${fmt(ec?.period, 's').padStart(9)}`
    );
  }
  
  // Save for charting
  const fs = await import('fs');
  fs.writeFileSync('3way-data.json', JSON.stringify(results, null, 2));
  console.log('');
  console.log('Saved 3way-data.json');
};

test3Way();
