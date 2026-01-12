// Blended Forecast Algorithm v2 - Tighter thresholds
// Run with: node test-blend-v2.js

const blendForecasts = (ww3, openMeteo, ecmwf) => {
  const values = [ww3, openMeteo, ecmwf].filter(v => v != null && !isNaN(v));
  
  if (values.length === 0) return { value: null, confidence: 'none', spread: null };
  if (values.length === 1) return { value: values[0], confidence: 'low', spread: null, note: 'single source' };
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  
  if (values.length === 2) {
    return {
      value: (values[0] + values[1]) / 2,
      confidence: spread < 0.5 ? 'high' : spread < 1 ? 'medium' : 'low',
      spread,
      range: [min, max]
    };
  }
  
  // 3 sources
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[1];
  
  const diffWW3_OM = Math.abs(ww3 - openMeteo);
  const diffWW3_EC = Math.abs(ww3 - ecmwf);
  const diffOM_EC = Math.abs(openMeteo - ecmwf);
  
  // HIGH confidence: all 3 within 0.5ft
  if (spread < 0.5) {
    return {
      value: (ww3 + openMeteo + ecmwf) / 3,
      confidence: 'high',
      spread,
      method: 'average (all agree)'
    };
  }
  
  // MEDIUM: spread 0.5-1.5ft OR 2 models agree closely
  const agreementThreshold = 0.5;  // tighter
  const outlierThreshold = 1.0;    // tighter
  
  // Check for 2-model agreement
  if (diffOM_EC < agreementThreshold && diffWW3_OM > outlierThreshold && diffWW3_EC > outlierThreshold) {
    const agreedValue = (openMeteo + ecmwf) / 2;
    return {
      value: agreedValue * 0.75 + ww3 * 0.25,
      confidence: 'medium',
      spread,
      method: 'weighted (OM+ECMWF agree)',
      outlier: 'WW3'
    };
  }
  
  if (diffWW3_EC < agreementThreshold && diffWW3_OM > outlierThreshold && diffOM_EC > outlierThreshold) {
    const agreedValue = (ww3 + ecmwf) / 2;
    return {
      value: agreedValue * 0.75 + openMeteo * 0.25,
      confidence: 'medium',
      spread,
      method: 'weighted (WW3+ECMWF agree)',
      outlier: 'Open-Meteo'
    };
  }
  
  if (diffWW3_OM < agreementThreshold && diffWW3_EC > outlierThreshold && diffOM_EC > outlierThreshold) {
    const agreedValue = (ww3 + openMeteo) / 2;
    return {
      value: agreedValue * 0.75 + ecmwf * 0.25,
      confidence: 'medium',
      spread,
      method: 'weighted (WW3+OM agree)',
      outlier: 'ECMWF'
    };
  }
  
  // Medium if spread is moderate (0.5-1.5ft) even without clear agreement
  if (spread < 1.5) {
    return {
      value: median,
      confidence: 'medium',
      spread,
      method: 'median (moderate spread)'
    };
  }
  
  // LOW confidence: spread > 1.5ft
  return {
    value: median,
    confidence: 'low',
    spread,
    range: [min, max],
    method: 'median (high uncertainty)',
    displayRange: `${min.toFixed(1)}-${max.toFixed(1)}ft`
  };
};


// Full 48hr data
const fullData = [
  { time: '01-09 04:00', ww3: 0.4, om: null, ecmwf: null },
  { time: '01-09 05:00', ww3: 0.4, om: 1.6, ecmwf: 1.7 },
  { time: '01-09 06:00', ww3: 0.4, om: 1.6, ecmwf: 1.6 },
  { time: '01-09 07:00', ww3: 0.5, om: 1.6, ecmwf: 1.6 },
  { time: '01-09 08:00', ww3: 0.6, om: 1.5, ecmwf: 1.6 },
  { time: '01-09 09:00', ww3: 0.6, om: 1.4, ecmwf: 1.5 },
  { time: '01-09 10:00', ww3: 0.8, om: 1.4, ecmwf: 1.5 },
  { time: '01-09 11:00', ww3: 0.9, om: 1.4, ecmwf: 1.4 },
  { time: '01-09 12:00', ww3: 1.0, om: 1.4, ecmwf: 1.4 },
  { time: '01-09 13:00', ww3: 1.2, om: 1.3, ecmwf: 1.4 },
  { time: '01-09 14:00', ww3: 1.5, om: 1.3, ecmwf: 1.4 },
  { time: '01-09 15:00', ww3: 1.9, om: 1.4, ecmwf: 1.4 },
  { time: '01-09 16:00', ww3: 2.1, om: 1.4, ecmwf: 1.5 },
  { time: '01-09 17:00', ww3: 2.3, om: 1.4, ecmwf: 1.6 },
  { time: '01-09 18:00', ww3: 2.4, om: 1.6, ecmwf: 1.8 },
  { time: '01-09 19:00', ww3: 2.6, om: 1.7, ecmwf: 1.9 },
  { time: '01-09 20:00', ww3: 2.7, om: 1.8, ecmwf: 2.1 },
  { time: '01-09 21:00', ww3: 2.9, om: 2.0, ecmwf: 2.2 },
  { time: '01-09 22:00', ww3: 3.1, om: 2.2, ecmwf: 2.4 },
  { time: '01-09 23:00', ww3: 3.3, om: 2.4, ecmwf: 2.5 },
  { time: '01-10 00:00', ww3: 3.5, om: 2.5, ecmwf: 2.6 },
  { time: '01-10 01:00', ww3: 3.4, om: 2.7, ecmwf: 2.8 },
  { time: '01-10 02:00', ww3: 3.2, om: 2.8, ecmwf: 3.0 },
  { time: '01-10 03:00', ww3: 2.9, om: 3.1, ecmwf: 3.3 },
  { time: '01-10 04:00', ww3: 2.7, om: 3.3, ecmwf: 3.5 },
  { time: '01-10 05:00', ww3: 2.5, om: 3.6, ecmwf: 3.9 },
  { time: '01-10 06:00', ww3: 2.3, om: 3.5, ecmwf: 3.9 },
  { time: '01-10 07:00', ww3: 2.1, om: 3.5, ecmwf: 4.1 },
  { time: '01-10 08:00', ww3: 2.0, om: 3.4, ecmwf: 4.1 },
  { time: '01-10 09:00', ww3: 1.9, om: 3.2, ecmwf: 3.9 },
  { time: '01-10 10:00', ww3: 1.7, om: 3.1, ecmwf: 3.7 },
  { time: '01-10 11:00', ww3: 1.7, om: 2.9, ecmwf: 3.5 },
  { time: '01-10 12:00', ww3: 1.6, om: 2.8, ecmwf: 3.3 },
  { time: '01-10 13:00', ww3: 1.6, om: 2.6, ecmwf: 3.1 },
  { time: '01-10 14:00', ww3: 1.6, om: 2.5, ecmwf: 3.0 },
  { time: '01-10 15:00', ww3: 1.7, om: 2.4, ecmwf: 2.8 },
  { time: '01-10 16:00', ww3: 1.8, om: 2.3, ecmwf: 2.6 },
  { time: '01-10 17:00', ww3: 2.1, om: 2.2, ecmwf: 2.5 },
  { time: '01-10 18:00', ww3: 2.4, om: 2.1, ecmwf: 2.4 },
  { time: '01-10 19:00', ww3: 2.9, om: 2.0, ecmwf: 2.3 },
  { time: '01-10 20:00', ww3: 3.5, om: 1.9, ecmwf: 2.2 },
  { time: '01-10 21:00', ww3: 4.0, om: 1.8, ecmwf: 2.1 },
  { time: '01-10 22:00', ww3: 4.2, om: 1.8, ecmwf: 2.0 },
  { time: '01-10 23:00', ww3: 4.2, om: 1.8, ecmwf: 1.9 },
  { time: '01-11 00:00', ww3: 4.2, om: 1.8, ecmwf: 2.1 },
  { time: '01-11 01:00', ww3: 4.0, om: 2.0, ecmwf: 2.4 },
  { time: '01-11 02:00', ww3: 3.9, om: 2.0, ecmwf: 2.6 },
  { time: '01-11 03:00', ww3: 3.7, om: 2.2, ecmwf: 3.0 },
];

console.log('=== BLENDED FORECAST v2 (Tighter Thresholds) ===\n');
console.log('Thresholds: High < 0.5ft | Medium < 1.5ft | Low > 1.5ft\n');
console.log('Time       | WW3   | OM    | ECMWF | Blended | Conf   | Method');
console.log('-'.repeat(90));

const confidenceCounts = { high: 0, medium: 0, low: 0 };

fullData.forEach(d => {
  const blend = blendForecasts(d.ww3, d.om, d.ecmwf);
  if (blend.confidence !== 'none') confidenceCounts[blend.confidence]++;
  
  const confEmoji = {
    'high': '🟢',
    'medium': '🟡', 
    'low': '🔴',
    'none': '⚫'
  }[blend.confidence];
  
  const ww3Str = d.ww3 != null ? d.ww3.toFixed(1) + 'ft' : ' --  ';
  const omStr = d.om != null ? d.om.toFixed(1) + 'ft' : ' --  ';
  const ecStr = d.ecmwf != null ? d.ecmwf.toFixed(1) + 'ft' : ' --  ';
  const blendStr = blend.value != null ? blend.value.toFixed(1) + 'ft' : ' --  ';
  
  // Show range for low confidence
  const displayVal = blend.confidence === 'low' && blend.displayRange 
    ? blend.displayRange 
    : blendStr;
  
  console.log(
    `${d.time} | ${ww3Str.padStart(5)} | ${omStr.padStart(5)} | ${ecStr.padStart(5)} | ` +
    `${displayVal.padStart(9)} | ${confEmoji} ${blend.confidence.padEnd(6)} | ${blend.method || ''}`
  );
});

const total = confidenceCounts.high + confidenceCounts.medium + confidenceCounts.low;
console.log('\n=== CONFIDENCE SUMMARY (v2) ===\n');
console.log(`🟢 High confidence:   ${confidenceCounts.high} hours (${(confidenceCounts.high/total*100).toFixed(0)}%)`);
console.log(`🟡 Medium confidence: ${confidenceCounts.medium} hours (${(confidenceCounts.medium/total*100).toFixed(0)}%)`);
console.log(`🔴 Low confidence:    ${confidenceCounts.low} hours (${(confidenceCounts.low/total*100).toFixed(0)}%)`);

// Compare to current Open-Meteo only approach
console.log('\n=== COMPARISON: Blended vs Open-Meteo Only ===\n');
console.log('Time       | OM Only | Blended | Diff   | Confidence');
console.log('-'.repeat(60));

let totalDiff = 0;
let diffCount = 0;

fullData.forEach(d => {
  if (d.om == null) return;
  const blend = blendForecasts(d.ww3, d.om, d.ecmwf);
  if (blend.value == null) return;
  
  const diff = blend.value - d.om;
  totalDiff += Math.abs(diff);
  diffCount++;
  
  const confEmoji = { 'high': '🟢', 'medium': '🟡', 'low': '🔴' }[blend.confidence];
  const diffStr = diff >= 0 ? `+${diff.toFixed(1)}ft` : `${diff.toFixed(1)}ft`;
  
  console.log(
    `${d.time} | ${d.om.toFixed(1)}ft   | ${blend.value.toFixed(1)}ft   | ${diffStr.padStart(6)} | ${confEmoji}`
  );
});

console.log('\n' + '-'.repeat(60));
console.log(`Average absolute difference: ${(totalDiff/diffCount).toFixed(2)}ft`);
console.log(`\nThis means your current forecast would change by ~${(totalDiff/diffCount).toFixed(1)}ft on average.`);
