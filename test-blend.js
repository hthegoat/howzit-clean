// Blended Forecast Algorithm
// Run with: node test-blend.js

const blendForecasts = (ww3, openMeteo, ecmwf) => {
  // Handle missing values
  const values = [ww3, openMeteo, ecmwf].filter(v => v != null && !isNaN(v));
  
  if (values.length === 0) return { value: null, confidence: 'none', spread: null };
  if (values.length === 1) return { value: values[0], confidence: 'low', spread: null, note: 'single source' };
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  
  // 2 sources
  if (values.length === 2) {
    return {
      value: (values[0] + values[1]) / 2,
      confidence: spread < 1 ? 'medium' : 'low',
      spread,
      range: [min, max]
    };
  }
  
  // 3 sources - the interesting case
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[1];
  
  // Check pairwise distances
  const diffWW3_OM = Math.abs(ww3 - openMeteo);
  const diffWW3_EC = Math.abs(ww3 - ecmwf);
  const diffOM_EC = Math.abs(openMeteo - ecmwf);
  
  // High confidence: all 3 within 1ft
  if (spread < 1) {
    return {
      value: (ww3 + openMeteo + ecmwf) / 3,
      confidence: 'high',
      spread,
      method: 'average (all agree)'
    };
  }
  
  // Medium confidence: 2 agree, 1 outlier (within 0.7ft of each other, outlier > 1.5ft away)
  const agreementThreshold = 0.7;
  const outlierThreshold = 1.5;
  
  // OM and ECMWF agree, WW3 is outlier
  if (diffOM_EC < agreementThreshold && diffWW3_OM > outlierThreshold && diffWW3_EC > outlierThreshold) {
    const agreedValue = (openMeteo + ecmwf) / 2;
    return {
      value: agreedValue * 0.7 + ww3 * 0.3,
      confidence: 'medium',
      spread,
      method: 'weighted (OM+ECMWF agree, WW3 outlier)',
      agreedPair: ['Open-Meteo', 'ECMWF'],
      outlier: 'WW3',
      agreedValue,
      outlierValue: ww3
    };
  }
  
  // WW3 and ECMWF agree, OM is outlier
  if (diffWW3_EC < agreementThreshold && diffWW3_OM > outlierThreshold && diffOM_EC > outlierThreshold) {
    const agreedValue = (ww3 + ecmwf) / 2;
    return {
      value: agreedValue * 0.7 + openMeteo * 0.3,
      confidence: 'medium',
      spread,
      method: 'weighted (WW3+ECMWF agree, OM outlier)',
      agreedPair: ['WW3', 'ECMWF'],
      outlier: 'Open-Meteo',
      agreedValue,
      outlierValue: openMeteo
    };
  }
  
  // WW3 and OM agree, ECMWF is outlier
  if (diffWW3_OM < agreementThreshold && diffWW3_EC > outlierThreshold && diffOM_EC > outlierThreshold) {
    const agreedValue = (ww3 + openMeteo) / 2;
    return {
      value: agreedValue * 0.7 + ecmwf * 0.3,
      confidence: 'medium',
      spread,
      method: 'weighted (WW3+OM agree, ECMWF outlier)',
      agreedPair: ['WW3', 'Open-Meteo'],
      outlier: 'ECMWF',
      agreedValue,
      outlierValue: ecmwf
    };
  }
  
  // Low confidence: all 3 diverge significantly - use median
  return {
    value: median,
    confidence: 'low',
    spread,
    range: [min, max],
    method: 'median (models diverge)',
    note: `Range: ${min.toFixed(1)}-${max.toFixed(1)}ft`
  };
};


// Test with actual data
const testData = [
  { time: '01-09 05:00', ww3: 0.4, om: 1.6, ecmwf: 1.7 },
  { time: '01-09 12:00', ww3: 1.0, om: 1.4, ecmwf: 1.4 },
  { time: '01-09 18:00', ww3: 2.4, om: 1.6, ecmwf: 1.8 },
  { time: '01-09 22:00', ww3: 3.1, om: 2.2, ecmwf: 2.4 },
  { time: '01-10 05:00', ww3: 2.5, om: 3.6, ecmwf: 3.9 },
  { time: '01-10 08:00', ww3: 2.0, om: 3.4, ecmwf: 4.1 },
  { time: '01-10 15:00', ww3: 1.7, om: 2.4, ecmwf: 2.8 },
  { time: '01-10 20:00', ww3: 3.5, om: 1.9, ecmwf: 2.2 },
  { time: '01-10 22:00', ww3: 4.2, om: 1.8, ecmwf: 2.0 },
  { time: '01-11 00:00', ww3: 4.2, om: 1.8, ecmwf: 2.1 },
  { time: '01-11 03:00', ww3: 3.7, om: 2.2, ecmwf: 3.0 },
];

console.log('=== BLENDED FORECAST ALGORITHM TEST ===\n');
console.log('Time       | WW3   | OM    | ECMWF | Blended | Conf   | Method');
console.log('-'.repeat(85));

testData.forEach(d => {
  const blend = blendForecasts(d.ww3, d.om, d.ecmwf);
  
  const confEmoji = {
    'high': '🟢',
    'medium': '🟡', 
    'low': '🔴',
    'none': '⚫'
  }[blend.confidence];
  
  console.log(
    `${d.time} | ${d.ww3.toFixed(1)}ft | ${d.om.toFixed(1)}ft | ${d.ecmwf.toFixed(1)}ft | ` +
    `${blend.value.toFixed(1)}ft   | ${confEmoji} ${blend.confidence.padEnd(6)} | ${blend.method || ''}`
  );
});

console.log('\n=== CONFIDENCE SUMMARY ===\n');

// Full 48hr test
const fullData = [
  { ww3: 0.4, om: 1.6, ecmwf: 1.7 },
  { ww3: 0.4, om: 1.6, ecmwf: 1.6 },
  { ww3: 0.5, om: 1.6, ecmwf: 1.6 },
  { ww3: 0.6, om: 1.5, ecmwf: 1.6 },
  { ww3: 0.6, om: 1.4, ecmwf: 1.5 },
  { ww3: 0.8, om: 1.4, ecmwf: 1.5 },
  { ww3: 0.9, om: 1.4, ecmwf: 1.4 },
  { ww3: 1.0, om: 1.4, ecmwf: 1.4 },
  { ww3: 1.2, om: 1.3, ecmwf: 1.4 },
  { ww3: 1.5, om: 1.3, ecmwf: 1.4 },
  { ww3: 1.9, om: 1.4, ecmwf: 1.4 },
  { ww3: 2.1, om: 1.4, ecmwf: 1.5 },
  { ww3: 2.3, om: 1.4, ecmwf: 1.6 },
  { ww3: 2.4, om: 1.6, ecmwf: 1.8 },
  { ww3: 2.6, om: 1.7, ecmwf: 1.9 },
  { ww3: 2.7, om: 1.8, ecmwf: 2.1 },
  { ww3: 2.9, om: 2.0, ecmwf: 2.2 },
  { ww3: 3.1, om: 2.2, ecmwf: 2.4 },
  { ww3: 3.3, om: 2.4, ecmwf: 2.5 },
  { ww3: 3.5, om: 2.5, ecmwf: 2.6 },
  { ww3: 3.4, om: 2.7, ecmwf: 2.8 },
  { ww3: 3.2, om: 2.8, ecmwf: 3.0 },
  { ww3: 2.9, om: 3.1, ecmwf: 3.3 },
  { ww3: 2.7, om: 3.3, ecmwf: 3.5 },
  { ww3: 2.5, om: 3.6, ecmwf: 3.9 },
  { ww3: 2.3, om: 3.5, ecmwf: 3.9 },
  { ww3: 2.1, om: 3.5, ecmwf: 4.1 },
  { ww3: 2.0, om: 3.4, ecmwf: 4.1 },
  { ww3: 1.9, om: 3.2, ecmwf: 3.9 },
  { ww3: 1.7, om: 3.1, ecmwf: 3.7 },
  { ww3: 1.7, om: 2.9, ecmwf: 3.5 },
  { ww3: 1.6, om: 2.8, ecmwf: 3.3 },
  { ww3: 1.6, om: 2.6, ecmwf: 3.1 },
  { ww3: 1.6, om: 2.5, ecmwf: 3.0 },
  { ww3: 1.7, om: 2.4, ecmwf: 2.8 },
  { ww3: 1.8, om: 2.3, ecmwf: 2.6 },
  { ww3: 2.1, om: 2.2, ecmwf: 2.5 },
  { ww3: 2.4, om: 2.1, ecmwf: 2.4 },
  { ww3: 2.9, om: 2.0, ecmwf: 2.3 },
  { ww3: 3.5, om: 1.9, ecmwf: 2.2 },
  { ww3: 4.0, om: 1.8, ecmwf: 2.1 },
  { ww3: 4.2, om: 1.8, ecmwf: 2.0 },
  { ww3: 4.2, om: 1.8, ecmwf: 1.9 },
  { ww3: 4.2, om: 1.8, ecmwf: 2.1 },
  { ww3: 4.0, om: 2.0, ecmwf: 2.4 },
  { ww3: 3.9, om: 2.0, ecmwf: 2.6 },
  { ww3: 3.7, om: 2.2, ecmwf: 3.0 },
];

const confidenceCounts = { high: 0, medium: 0, low: 0 };
fullData.forEach(d => {
  const blend = blendForecasts(d.ww3, d.om, d.ecmwf);
  confidenceCounts[blend.confidence]++;
});

console.log(`🟢 High confidence:   ${confidenceCounts.high} hours (${(confidenceCounts.high/fullData.length*100).toFixed(0)}%)`);
console.log(`🟡 Medium confidence: ${confidenceCounts.medium} hours (${(confidenceCounts.medium/fullData.length*100).toFixed(0)}%)`);
console.log(`🔴 Low confidence:    ${confidenceCounts.low} hours (${(confidenceCounts.low/fullData.length*100).toFixed(0)}%)`);

// Export for use in app
console.log('\n=== EXPORTABLE FUNCTION ===\n');
console.log('Copy blendForecasts() to your app - it returns:');
console.log('{ value, confidence, spread, method, range?, note? }');
