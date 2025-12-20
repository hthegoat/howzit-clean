// Howzit Rating System v4
// Tuned for East Coast conditions
// Accounts for buoy-to-shore conversion

export const useHowzitRating = () => {
  
  // Buoy readings are typically 40-60% higher than surf face
  // We use 0.55 as a reasonable conversion factor
  const BUOY_TO_SURF_FACTOR = 0.55
  
  /**
   * Convert buoy wave height to estimated surf height
   */
  const buoyToSurf = (buoyHeight) => {
    return buoyHeight * BUOY_TO_SURF_FACTOR
  }
  
  /**
   * Calculate wind quality score (0-40)
   */
  const getWindScore = (windDirection, windSpeed, beachOrientation = 90) => {
    // High wind is generally bad
    if (windSpeed > 20) return 5
    if (windSpeed > 18) return 10
    
    let diff = 90 // assume cross if unknown
    if (windDirection !== null && windDirection !== undefined) {
      diff = Math.abs(windDirection - beachOrientation)
      if (diff > 180) diff = 360 - diff
    }
    
    // Base direction score
    let dirScore = 0
    if (diff >= 150) dirScore = 40       // Offshore
    else if (diff >= 120) dirScore = 30  // Cross-off
    else if (diff >= 90) dirScore = 20   // Cross
    else if (diff >= 60) dirScore = 10   // Cross-on
    else dirScore = 5                     // Onshore
    
    // Wind speed modifier - reduce score for stronger wind
    let speedMod = 1.0
    if (windSpeed > 15) speedMod = 0.5
    else if (windSpeed > 12) speedMod = 0.65
    else if (windSpeed > 10) speedMod = 0.8
    else if (windSpeed > 7) speedMod = 0.9
    
    // Offshore can handle more wind
    if (diff >= 150 && windSpeed > 10) speedMod = Math.min(1, speedMod + 0.25)
    
    return Math.round(dirScore * speedMod)
  }
  
  /**
   * Calculate wave quality score (0-60)
   * Uses SURF HEIGHT (already converted from buoy)
   */
  const getWaveScore = (surfHeight, wavePeriod) => {
    if (!surfHeight || surfHeight < 0.3) return 0
    
    // Height score (0-35) - based on actual surf face height
    let heightScore = 0
    if (surfHeight >= 3 && surfHeight <= 5) heightScore = 35       // Sweet spot (overhead+)
    else if (surfHeight >= 2.5 && surfHeight < 3) heightScore = 32 // Head high
    else if (surfHeight >= 5 && surfHeight <= 7) heightScore = 30  // Big
    else if (surfHeight >= 2 && surfHeight < 2.5) heightScore = 28 // Chest-head
    else if (surfHeight >= 1.5 && surfHeight < 2) heightScore = 22 // Waist-chest
    else if (surfHeight >= 1 && surfHeight < 1.5) heightScore = 14 // Knee-waist
    else if (surfHeight >= 0.5 && surfHeight < 1) heightScore = 6  // Ankle-knee
    else if (surfHeight < 0.5) heightScore = 2                      // Flat
    else heightScore = 25 // > 7ft, heavy
    
    // Period score (0-25)
    let periodScore = 0
    if (!wavePeriod || wavePeriod < 5) periodScore = 3    // Wind chop
    else if (wavePeriod < 7) periodScore = 8              // Short
    else if (wavePeriod < 9) periodScore = 14             // Moderate
    else if (wavePeriod < 11) periodScore = 20            // Good
    else if (wavePeriod < 14) periodScore = 23            // Great
    else periodScore = 25                                  // Long period swell
    
    return heightScore + periodScore
  }
  
  /**
   * Calculate overall Howzit rating (0-100)
   * waveHeight should be BUOY reading - we convert internally
   */
  const calculateRating = ({ waveHeight, wavePeriod, windSpeed, windDirection, beachOrientation = 90 }) => {
    // Convert buoy height to estimated surf height
    const surfHeight = buoyToSurf(waveHeight || 0)
    
    const waveScore = getWaveScore(surfHeight, wavePeriod)  // 0-60
    const windScore = getWindScore(windDirection, windSpeed, beachOrientation)  // 0-40
    
    // Hard cap: tiny surf can't be good
    if (surfHeight < 1) {
      return Math.min(20, waveScore + windScore)
    }
    
    // Hard cap: small surf caps at Fair+
    if (surfHeight < 1.5) {
      return Math.min(35, waveScore + windScore)
    }
    
    // Hard cap: short period wind swell with onshore = bad
    if (wavePeriod && wavePeriod < 6 && windSpeed > 12) {
      return Math.min(30, waveScore + windScore)
    }
    
    return waveScore + windScore
  }
  
  /**
   * Convert score to stars (0-5)
   */
  const scoreToStars = (score) => {
    if (score >= 70) return 5
    if (score >= 55) return 4
    if (score >= 40) return 3
    if (score >= 28) return 2
    if (score >= 15) return 1
    return 0
  }
  
  /**
   * Convert score to label
   */
  const scoreToLabel = (score) => {
    if (score >= 70) return 'Epic'
    if (score >= 55) return 'Good'
    if (score >= 40) return 'Fair+'
    if (score >= 28) return 'Fair'
    if (score >= 15) return 'Poor'
    return 'Flat'
  }
  
  /**
   * Convert score to color
   */
  const scoreToColor = (score) => {
    if (score >= 70) return '#22c55e'  // green - epic
    if (score >= 55) return '#4ade80'  // light green - good
    if (score >= 40) return '#a3e635'  // lime - fair+
    if (score >= 28) return '#facc15'  // yellow - fair
    if (score >= 15) return '#fb923c'  // orange - poor
    return '#f87171'                    // red - flat
  }
  
  /**
   * Get wind quality label
   */
  const getWindQuality = (windDirection, beachOrientation = 90) => {
    if (windDirection === null || windDirection === undefined) return 'unknown'
    
    let diff = Math.abs(windDirection - beachOrientation)
    if (diff > 180) diff = 360 - diff
    
    if (diff >= 150) return 'offshore'
    if (diff >= 120) return 'cross-off'
    if (diff >= 90) return 'cross'
    if (diff >= 60) return 'cross-on'
    if (diff >= 30) return 'side-on'
    return 'onshore'
  }
  
  /**
   * Get wind quality color
   */
  const getWindColor = (windDirection, beachOrientation = 90) => {
    const quality = getWindQuality(windDirection, beachOrientation)
    const colors = {
      'offshore': '#22c55e',
      'cross-off': '#4ade80',
      'cross': '#facc15',
      'cross-on': '#fb923c',
      'side-on': '#f87171',
      'onshore': '#ef4444',
      'unknown': '#9ca3af'
    }
    return colors[quality]
  }
  
  return {
    calculateRating,
    getWaveScore,
    getWindScore,
    scoreToStars,
    scoreToLabel,
    scoreToColor,
    getWindQuality,
    getWindColor,
    buoyToSurf,
    BUOY_TO_SURF_FACTOR
  }
}
