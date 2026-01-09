// Howzit Rating System v10
// Tuned for East Coast conditions - conservative and realistic
// Goal: Match what an experienced local would say about a day
// 
// Rating scale:
// - Epic (70+): Rare, firing conditions - clean groundswell, offshore winds
// - Good (55-69): Worth calling in sick - solid swell, favorable winds  
// - Fair+ (40-54): Fun session - decent size/period, manageable wind
// - Fair (25-39): Surfable - small or choppy but rideable
// - Poor (12-24): Barely worth it - tiny, blown out, or poor period
// - Flat (0-11): Not surfable

export const useHowzitRating = () => {
  
  const angleDiff = (dir1, dir2) => {
    if (dir1 === null || dir2 === null) return 90
    let diff = Math.abs(dir1 - dir2)
    return diff > 180 ? 360 - diff : diff
  }

  /**
   * Period quality - East Coast tuned
   * 6-8s is actually common and surfable on EC
   */
  const getPeriodWeight = (period) => {
    if (!period || period < 4) return 0.2   // Pure wind chop
    if (period < 5) return 0.4              // Short wind swell
    if (period < 6) return 0.55             // Typical wind swell
    if (period < 7) return 0.7              // Better wind swell
    if (period < 8) return 0.8              // Good short-period
    if (period < 10) return 0.9             // Solid swell
    if (period < 12) return 1.0             // Ground swell
    if (period < 15) return 1.1             // Long period
    return 1.15                              // Very long period
  }

  /**
   * Wind quality score (0-35)
   * Less punishing for moderate winds
   */
  const getWindScore = (windDirection, windSpeed, windGust, beachOrientation = 90) => {
    const gustMph = windGust ? windGust * 0.621 : 0
    const windMph = windSpeed ? windSpeed * 0.621 : 0
    
    // Use effective wind (blend of sustained and gusts)
    const effectiveWind = Math.max(windMph || 0, gustMph * 0.6)
    
    // Calculate direction score
    let diff = 90
    if (windDirection !== null && windDirection !== undefined) {
      const offshoreDirection = (beachOrientation + 180) % 360
      diff = angleDiff(windDirection, offshoreDirection)
    }
    
    // Direction-based score (max 35)
    let dirScore = 0
    if (diff <= 30) dirScore = 35            // Offshore - best
    else if (diff <= 60) dirScore = 28       // Cross-off - great
    else if (diff <= 90) dirScore = 20       // Cross - fine
    else if (diff <= 120) dirScore = 12      // Cross-on - okay
    else dirScore = 5                         // Onshore - worst
    
    // Light wind bonus
    if (effectiveWind < 5) return Math.min(35, dirScore + 5)
    if (effectiveWind < 8) return Math.min(35, dirScore + 2)
    
    // Wind speed penalty - gentler curve
    let speedMod = 1.0
    if (effectiveWind > 25) speedMod = 0.2
    else if (effectiveWind > 20) speedMod = 0.4
    else if (effectiveWind > 15) speedMod = 0.6
    else if (effectiveWind > 12) speedMod = 0.75
    else if (effectiveWind > 10) speedMod = 0.85
    
    return Math.round(dirScore * speedMod)
  }
  
  /**
   * Wave quality score (0-65)
   * Smoother curve, less punishing for small waves
   */
  const getWaveScore = ({
    swellWaveHeight,
    swellWavePeriod,
    windWaveHeight,
    waveHeight,
    wavePeriod,
    beachOrientation = 90,
    swellWaveDirection
  }) => {
    const toFeet = (h) => h && h < 10 ? h * 3.281 : h
    
    const swellFt = toFeet(swellWaveHeight) || 0
    const windChopFt = toFeet(windWaveHeight) || 0
    const combinedFt = toFeet(waveHeight) || 0
    
    // Use the better of swell or combined
    const surfableHeight = Math.max(swellFt, combinedFt * 0.8)
    const period = swellWavePeriod || wavePeriod || 6
    
    if (surfableHeight < 0.3) return 0
    
    // Height score (0-40) - smoother curve
    let heightScore = 0
    if (surfableHeight >= 5) heightScore = 40        // Solid
    else if (surfableHeight >= 4) heightScore = 38   
    else if (surfableHeight >= 3.5) heightScore = 35 
    else if (surfableHeight >= 3) heightScore = 32   
    else if (surfableHeight >= 2.5) heightScore = 28 
    else if (surfableHeight >= 2) heightScore = 24   // Fun size
    else if (surfableHeight >= 1.5) heightScore = 18 
    else if (surfableHeight >= 1) heightScore = 12   // Small but surfable
    else if (surfableHeight >= 0.5) heightScore = 6  // Minimal
    else heightScore = 2
    
    // Period quality (0-25)
    const periodWeight = getPeriodWeight(period)
    const periodScore = Math.round(periodWeight * 25)
    
    // Wind chop penalty - only if significant
    let chopPenalty = 0
    if (windChopFt > swellFt * 1.2 && swellFt > 0) {
      chopPenalty = Math.min(10, (windChopFt / swellFt - 1) * 8)
    }
    
    // Direction factor
    const dirFactor = getDirectionFactor(swellWaveDirection, beachOrientation)
    const baseScore = heightScore + periodScore - chopPenalty
    
    return Math.max(0, Math.round(baseScore * (0.7 + dirFactor * 0.3)))
  }
  
  /**
   * Direction matching
   */
  const getDirectionFactor = (swellDirection, beachOrientation, swellWindow = 90) => {
    if (swellDirection === null || swellDirection === undefined) return 0.7
    
    const diff = angleDiff(swellDirection, beachOrientation)
    
    if (diff <= 45) return 1.0      // Direct hit
    if (diff <= 70) return 0.85     // Good angle
    if (diff <= 90) return 0.7      // Okay angle
    if (diff <= 120) return 0.5     // Marginal
    return 0.3                       // Shadow
  }

  /**
   * Main rating calculation (0-100)
   */
  const calculateRating = (params) => {
    const {
      waveHeight,
      wavePeriod,
      windWaveHeight,
      windWavePeriod,
      swellWaveHeight,
      swellWavePeriod,
      swellWaveDirection,
      windSpeed,
      windDirection,
      windGust,
      beachOrientation = 90
    } = params
    
    const toFeet = (h) => h && h < 10 ? h * 3.281 : h
    const swellFt = toFeet(swellWaveHeight) || 0
    const combinedFt = toFeet(waveHeight) || 0
    const windChopFt = toFeet(windWaveHeight) || 0
    const gustMph = windGust ? windGust * 0.621 : 0
    const windMph = windSpeed ? windSpeed * 0.621 : 0
    
    // Quick checks for truly bad conditions
    const effectiveHeight = Math.max(swellFt, combinedFt * 0.8)
    
    // Flat - nothing to surf
    if (effectiveHeight < 0.5) {
      return 5
    }
    
    // Determine effective period - use period from dominant wave component
    // If wind chop dominates, use wind wave period (usually shorter = worse)
    let period = wavePeriod || 6
    if (windChopFt > swellFt && windWavePeriod) {
      // Wind waves dominate - use wind wave period
      period = windWavePeriod
    } else if (swellFt > 0 && swellWavePeriod) {
      // Swell dominates - use swell period
      period = swellWavePeriod
    }
    
    // Skepticism check: tiny swell with long period is misleading
    // If swell is under 1.5ft but showing 7s+ period, cap the effective period
    // Real ground swell at 8s+ would produce bigger waves
    if (swellFt < 1.5 && period > 7) {
      period = Math.min(period, 6)  // Treat as wind swell
    }
    
    // Calculate component scores
    const waveScore = getWaveScore({
      swellWaveHeight,
      swellWavePeriod,
      windWaveHeight,
      waveHeight,
      wavePeriod: period, // Use our calculated effective period
      beachOrientation,
      swellWaveDirection
    })
    
    const windScore = getWindScore(windDirection, windSpeed, windGust, beachOrientation)
    
    let total = waveScore + windScore
    
    // Conditions-based caps (gentler)
    
    // Very windy - cap the score
    if (gustMph > 30 || windMph > 25) {
      total = Math.min(total, 25)
    } else if (gustMph > 25 || windMph > 20) {
      total = Math.min(total, 40)
    }
    
    // Short period + wind = messy
    if (period < 5 && windMph > 12) {
      total = Math.min(total, 35)
    }
    
    // Chop dominant - wind waves bigger than swell = messy conditions
    if (windChopFt > swellFt * 1.5 && swellFt < 1.5) {
      total = Math.min(total, 35)
    }
    // Wind chop dominates significantly = downgrade further
    if (windChopFt > swellFt * 2) {
      total = Math.min(total, 30)  // Chop dominant = Poor+ max
    }
    
    // Height-based caps - small surf can't rate high
    // But decent height should still be able to score well
    if (effectiveHeight < 1) {
      total = Math.min(total, 20)  // Under 1ft = Poor max
    } else if (effectiveHeight < 1.5) {
      total = Math.min(total, 30)  // Under 1.5ft = Poor+ max
    } else if (effectiveHeight <= 2) {
      total = Math.min(total, 40)  // 2ft or less = Fair max
    } else if (effectiveHeight < 2.5) {
      total = Math.min(total, 50)  // Under 2.5ft = Fair+ max
    } else if (effectiveHeight < 3) {
      total = Math.min(total, 60)  // Under 3ft = Good max
    }
    // 3ft+ can rate up to Epic with good conditions
    
    // Period-based caps - but be lenient since Open-Meteo periods are unreliable
    // Only penalize truly short periods
    if (period < 4) {
      total = Math.min(total, 25)  // Pure chop = Poor max
    } else if (period < 5) {
      total = Math.min(total, 35)  // Very short = Poor+ max  
    }
    // Don't cap further - let height drive the rating
    
    // Combined small + short period = extra penalty
    if (effectiveHeight <= 2 && period < 5) {
      total = Math.min(total, 25)  // Small + very short = Poor max
    } else if (effectiveHeight <= 2 && period < 6) {
      total = Math.min(total, 35)  // Small + short = Poor+ max
    }
    
    return Math.max(0, Math.min(100, Math.round(total)))
  }
  
  const scoreToStars = (score) => {
    if (score >= 70) return 5
    if (score >= 55) return 4
    if (score >= 40) return 3
    if (score >= 25) return 2
    if (score >= 12) return 1
    return 0
  }
  
  const scoreToLabel = (score) => {
    if (score >= 70) return 'Epic'
    if (score >= 55) return 'Good'
    if (score >= 45) return 'Fair+'
    if (score >= 35) return 'Fair'
    if (score >= 25) return 'Poor+'
    if (score >= 12) return 'Poor'
    return 'Flat'
  }
  
  const scoreToColor = (score) => {
    if (score >= 55) return '#10b981'  // Good/Epic - Emerald
    if (score >= 35) return '#3b82f6'  // Fair - Blue
    if (score >= 10) return '#fb7185'  // Poor - Rose
    return '#d1d5db'                   // Flat - Gray
  }
  
  const getWindQuality = (windDirection, beachOrientation = 90) => {
    if (windDirection === null || windDirection === undefined) return 'unknown'
    
    const offshoreDirection = (beachOrientation + 180) % 360
    const diff = angleDiff(windDirection, offshoreDirection)
    
    if (diff <= 30) return 'offshore'
    if (diff <= 60) return 'cross-off'
    if (diff <= 90) return 'cross'
    if (diff <= 120) return 'cross-on'
    return 'onshore'
  }
  
  const getWindColor = (windDirection, beachOrientation = 90) => {
    const quality = getWindQuality(windDirection, beachOrientation)
    return {
      'offshore': '#10b981',
      'cross-off': '#10b981',
      'cross': '#3b82f6',
      'cross-on': '#fb7185',
      'onshore': '#fb7185',
      'unknown': '#9ca3af'
    }[quality]
  }
  
  const formatDirection = (degrees) => {
    if (degrees === null || degrees === undefined) return '--'
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return dirs[Math.round(degrees / 22.5) % 16]
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
    getPeriodWeight,
    getDirectionFactor,
    formatDirection
  }
}
