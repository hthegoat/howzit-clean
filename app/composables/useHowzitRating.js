// Howzit Rating System v12
// Region-aware rating — each sub-region has calibrated expectations
// Goal: Match what an experienced LOCAL would say about a day at their break
//
// surfRegion: 'northeast' | 'mid_atlantic' | 'outer_banks' | 'southeast' | 'florida_ne' | 'florida_se' | 'gulf' | 'west' 
// coastType: derived from surfRegion (east/west) — kept for backward compatibility
// 
// Rating scale (4-tier):
// - Epic (70+): Call in sick. Rare, firing conditions.
// - Good (40-69): Solid session. Fun waves, worth the paddle.
// - Junky (12-39): Choppy, weak, or blown out. For the dedicated.
// - Flat (0-11): Nothing to ride.

export const useHowzitRating = () => {
  
  const angleDiff = (dir1, dir2) => {
    if (dir1 === null || dir2 === null) return 90
    let diff = Math.abs(dir1 - dir2)
    return diff > 180 ? 360 - diff : diff
  }

  /**
   * Region config — what makes a "good day" varies dramatically by location
   * 
   * Each region defines:
   * - periodCurve: how much period matters (lower values = more forgiving of short periods)
   * - heightCaps: what wave heights map to what score ceilings
   * - skepticism: whether to doubt small swell + long period data artifacts
   * - directionWeight: how much swell direction matters (shelf refraction vs. exposed coast)
   */
  const REGION_CONFIG = {
    // === EAST COAST REGIONS ===
    
    northeast: {
      // Maine → Connecticut. Nor'easter territory. Rocky points + beach breaks.
      // 7-10s is a solid swell. Rarely sees 12s+.
      coastType: 'east',
      periodCurve: {
        3: 0.20, 4: 0.35, 5: 0.50, 6: 0.65, 7: 0.75, 8: 0.85, 9: 0.90,
        10: 1.0, 11: 1.0, 12: 1.05, 14: 1.1, 16: 1.1, 18: 1.15
      },
      heightCaps: { 1: 20, 1.5: 35, 2: 45, 2.5: 55, 3: 65 },
      skepticism: true,
      directionWeight: 0.3,
      periodCap: { under5: 35, under6: null }, // Less harsh on 5s swell
      smallComboMax: { under5: 30, under6: 40 },
    },
    
    mid_atlantic: {
      // New York → Virginia. Beach breaks, jetties, sandbars. The v10 baseline.
      // 8-10s is solid, 12s+ is a special event.
      coastType: 'east',
      periodCurve: {
        3: 0.20, 4: 0.40, 5: 0.55, 6: 0.70, 7: 0.80, 8: 0.90, 9: 0.90,
        10: 1.0, 11: 1.0, 12: 1.1, 14: 1.1, 16: 1.15, 18: 1.15
      },
      heightCaps: { 1: 20, 1.5: 30, 2: 40, 2.5: 50, 3: 60 },
      skepticism: true,
      directionWeight: 0.3,
      periodCap: { under5: 35, under6: null },
      smallComboMax: { under5: 25, under6: 35 },
    },
    
    outer_banks: {
      // North Carolina. Juts into the Atlantic, catches everything.
      // Gets real ground swell 10-14s. Hatteras is almost a different ocean.
      coastType: 'east',
      periodCurve: {
        3: 0.20, 4: 0.35, 5: 0.50, 6: 0.65, 7: 0.75, 8: 0.85, 9: 0.90,
        10: 1.0, 11: 1.05, 12: 1.1, 14: 1.15, 16: 1.15, 18: 1.2
      },
      heightCaps: { 1: 20, 1.5: 30, 2: 40, 2.5: 50, 3: 60 },
      skepticism: true,
      directionWeight: 0.3,
      periodCap: { under5: 35, under6: null },
      smallComboMax: { under5: 25, under6: 35 },
    },
    
    southeast: {
      // SC → Georgia. Wide continental shelf dampens everything.
      // Anything rideable is a win. 2-3ft @ 7-9s is a GOOD day.
      coastType: 'east',
      periodCurve: {
        3: 0.25, 4: 0.45, 5: 0.60, 6: 0.75, 7: 0.85, 8: 0.90, 9: 0.95,
        10: 1.0, 11: 1.05, 12: 1.1, 14: 1.1, 16: 1.15, 18: 1.15
      },
      heightCaps: { 1: 25, 1.5: 40, 2: 50, 2.5: 60, 3: 70 },
      skepticism: true,
      directionWeight: 0.3,
      periodCap: { under5: 35, under6: null },
      smallComboMax: { under5: 30, under6: 40 },
    },
    
    florida_ne: {
      // Jax → Cape Canaveral. Wind swell dominant, NE-facing.
      // 5-7s is NORMAL and surfable. 3ft @ 6s with offshore = good day.
      // Period curve is flatter — don't punish short period as hard.
      // 4s wind swell is common and rideable here.
      coastType: 'east',
      periodCurve: {
        3: 0.35, 4: 0.50, 5: 0.65, 6: 0.80, 7: 0.88, 8: 0.92, 9: 0.95,
        10: 1.0, 11: 1.05, 12: 1.1, 14: 1.1, 16: 1.15, 18: 1.15
      },
      heightCaps: { 1: 25, 1.5: 40, 2: 55, 2.5: 65, 3: 75 },
      skepticism: false, // Short-period swell is real here, not an artifact
      directionWeight: 0.3,
      periodCap: { under5: 40, under6: null }, // 5s swell is normal, don't cap hard
      smallComboMax: { under5: 35, under6: 45 },
    },
    
    florida_se: {
      // Palm Beach → Miami. Refraction swell from NW fronts.
      // Very short period normal. Window-based surfing.
      coastType: 'east',
      periodCurve: {
        3: 0.35, 4: 0.50, 5: 0.65, 6: 0.80, 7: 0.88, 8: 0.92, 9: 0.95,
        10: 1.0, 11: 1.05, 12: 1.1, 14: 1.1, 16: 1.15, 18: 1.15
      },
      heightCaps: { 1: 25, 1.5: 40, 2: 55, 2.5: 65, 3: 75 },
      skepticism: false,
      directionWeight: 0.25, // Refraction bends everything — less directional
      periodCap: { under5: 40, under6: null },
      smallComboMax: { under5: 35, under6: 45 },
    },
    
    gulf: {
      // Gulf Coast Florida. South-facing, rare surf.
      // Needs tropical systems or cold fronts. Everything rideable is exciting.
      coastType: 'east',
      periodCurve: {
        3: 0.35, 4: 0.50, 5: 0.65, 6: 0.80, 7: 0.90, 8: 0.95, 9: 1.0,
        10: 1.05, 11: 1.1, 12: 1.1, 14: 1.15, 16: 1.15, 18: 1.2
      },
      heightCaps: { 1: 30, 1.5: 45, 2: 60, 2.5: 70, 3: 80 },
      skepticism: false,
      directionWeight: 0.3,
      periodCap: { under5: 40, under6: null },
      smallComboMax: { under5: 35, under6: 45 },
    },
    
    // === WEST COAST ===
    
    west: {
      coastType: 'west',
      periodCurve: {
        4: 0.20, 5: 0.30, 6: 0.45, 7: 0.45, 8: 0.60, 9: 0.60,
        10: 0.80, 11: 0.80, 12: 1.0, 13: 1.0, 14: 1.15, 15: 1.15,
        16: 1.3, 18: 1.3, 20: 1.4
      },
      heightCaps: null, // Uses effective height system instead
      skepticism: false,
      directionWeight: 0.6,
      periodCap: { under5: 35, under6: null },
      smallComboMax: { under5: 25, under6: 35 },
    },
  }
  
  /**
   * Get region config, with fallback to mid_atlantic (the original v10 baseline)
   */
  const getRegionConfig = (surfRegion) => {
    return REGION_CONFIG[surfRegion] || REGION_CONFIG['mid_atlantic']
  }

  /**
   * Period quality — region-aware via interpolated curve
   */
  const getPeriodWeight = (period, surfRegion = 'mid_atlantic') => {
    if (!period) return 0.2
    // period < 3 is truly unsurfable everywhere
    if (period < 3) return 0.15
    
    // Backward compat: if surfRegion is 'east' or 'west', map to specific region
    if (surfRegion === 'east') surfRegion = 'mid_atlantic'
    if (surfRegion === 'west') surfRegion = 'west'
    
    const config = getRegionConfig(surfRegion)
    const curve = config.periodCurve
    const keys = Object.keys(curve).map(Number).sort((a, b) => a - b)
    
    // Clamp to curve bounds
    if (period <= keys[0]) return curve[keys[0]]
    if (period >= keys[keys.length - 1]) return curve[keys[keys.length - 1]]
    
    // Interpolate between nearest keys
    for (let i = 0; i < keys.length - 1; i++) {
      if (period >= keys[i] && period <= keys[i + 1]) {
        const t = (period - keys[i]) / (keys[i + 1] - keys[i])
        return curve[keys[i]] + t * (curve[keys[i + 1]] - curve[keys[i]])
      }
    }
    
    return 0.7 // fallback
  }

  /**
   * Wind quality score (0-35)
   * Identical across all regions — wind is wind
   */
  const getWindScore = (windDirection, windSpeed, windGust, beachOrientation = 90) => {
    const gustMph = windGust ? windGust * 0.621 : 0
    const windMph = windSpeed ? windSpeed * 0.621 : 0
    
    const effectiveWind = Math.max(windMph || 0, gustMph * 0.6)
    
    let diff = 90
    if (windDirection !== null && windDirection !== undefined) {
      const offshoreDirection = (beachOrientation + 180) % 360
      diff = angleDiff(windDirection, offshoreDirection)
    }
    
    let dirScore = 0
    if (diff <= 30) dirScore = 35
    else if (diff <= 60) dirScore = 28
    else if (diff <= 90) dirScore = 20
    else if (diff <= 120) dirScore = 12
    else dirScore = 5
    
    if (effectiveWind < 5) return Math.min(35, dirScore + 5)
    if (effectiveWind < 8) return Math.min(35, dirScore + 2)
    
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
   * Region-aware via period weighting and height interpretation
   */
  const getWaveScore = ({
    swellWaveHeight,
    swellWavePeriod,
    windWaveHeight,
    waveHeight,
    wavePeriod,
    beachOrientation = 90,
    swellWaveDirection,
    surfRegion = 'mid_atlantic'
  }) => {
    const config = getRegionConfig(surfRegion)
    const coastType = config.coastType
    const toFeet = (h) => h && h < 10 ? h * 3.281 : h
    
    const swellFt = toFeet(swellWaveHeight) || 0
    const windChopFt = toFeet(windWaveHeight) || 0
    const combinedFt = toFeet(waveHeight) || 0
    
    const surfableHeight = Math.max(swellFt, combinedFt * 0.8)
    const period = swellWavePeriod || wavePeriod || 6
    
    if (surfableHeight < 0.3) return 0
    
    // Height score (0-40)
    let scoringHeight = surfableHeight
    if (coastType === 'west' && period >= 10) {
      const periodBonus = 1 + (period - 9) * 0.12
      scoringHeight = surfableHeight * Math.min(periodBonus, 2.0)
    }
    
    let heightScore = 0
    if (scoringHeight >= 5) heightScore = 40
    else if (scoringHeight >= 4) heightScore = 38
    else if (scoringHeight >= 3.5) heightScore = 35
    else if (scoringHeight >= 3) heightScore = 32
    else if (scoringHeight >= 2.5) heightScore = 28
    else if (scoringHeight >= 2) heightScore = 24
    else if (scoringHeight >= 1.5) heightScore = 18
    else if (scoringHeight >= 1) heightScore = 12
    else if (scoringHeight >= 0.5) heightScore = 6
    else heightScore = 2
    
    // Period quality (0-25) — region-aware
    const periodWeight = getPeriodWeight(period, surfRegion)
    const periodScore = Math.round(periodWeight * 25)
    
    // Wind chop penalty
    let chopPenalty = 0
    if (windChopFt > swellFt * 1.2 && swellFt > 0) {
      chopPenalty = Math.min(10, (windChopFt / swellFt - 1) * 8)
    }
    
    // Direction factor — region-aware weight
    const dirFactor = getDirectionFactor(swellWaveDirection, beachOrientation, coastType)
    const baseScore = heightScore + periodScore - chopPenalty
    const dirWeight = config.directionWeight
    
    return Math.max(0, Math.round(baseScore * ((1 - dirWeight) + dirFactor * dirWeight)))
  }
  
  /**
   * Swell direction matching
   * coastType controls the curve shape (east = forgiving, west = strict)
   */
  const getDirectionFactor = (swellDirection, beachOrientation, coastType = 'east') => {
    if (swellDirection === null || swellDirection === undefined) return 0.7
    
    const diff = angleDiff(swellDirection, beachOrientation)
    
    if (coastType === 'east') {
      if (diff <= 45) return 1.0
      if (diff <= 70) return 0.85
      if (diff <= 90) return 0.7
      if (diff <= 120) return 0.5
      return 0.3
    }
    
    // West Coast — tighter windows
    if (diff <= 30) return 1.0
    if (diff <= 50) return 0.85
    if (diff <= 70) return 0.65
    if (diff <= 90) return 0.45
    if (diff <= 110) return 0.25
    return 0.1
  }

  /**
   * Main rating calculation (0-100)
   * surfRegion drives all region-specific behavior
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
      beachOrientation = 90,
      surfRegion = 'mid_atlantic',
      coastType // backward compat
    } = params
    
    // Backward compat: if coastType is passed but not surfRegion, map it
    const effectiveRegion = (surfRegion !== 'mid_atlantic') ? surfRegion 
      : (coastType === 'west') ? 'west' 
      : surfRegion
    
    const config = getRegionConfig(effectiveRegion)
    
    const toFeet = (h) => h && h < 10 ? h * 3.281 : h
    const swellFt = toFeet(swellWaveHeight) || 0
    const combinedFt = toFeet(waveHeight) || 0
    const windChopFt = toFeet(windWaveHeight) || 0
    const gustMph = windGust ? windGust * 0.621 : 0
    const windMph = windSpeed ? windSpeed * 0.621 : 0
    
    const effectiveHeight = Math.max(swellFt, combinedFt * 0.8)
    
    // Flat — nothing to surf (universal)
    if (effectiveHeight < 0.5) {
      return 5
    }
    
    // Determine effective period
    let period = wavePeriod || 6
    if (windChopFt > swellFt && windWavePeriod) {
      period = windWavePeriod
    } else if (swellFt > 0 && swellWavePeriod) {
      period = swellWavePeriod
    }
    
    // Skepticism check — only for regions where small swell + long period is likely a data artifact
    if (config.skepticism) {
      if (swellFt < 1.5 && period > 7) {
        period = Math.min(period, 6)
      }
    }
    
    // Calculate component scores
    const waveScore = getWaveScore({
      swellWaveHeight,
      swellWavePeriod,
      windWaveHeight,
      waveHeight,
      wavePeriod: period,
      beachOrientation,
      swellWaveDirection,
      surfRegion: effectiveRegion
    })
    
    const windScore = getWindScore(windDirection, windSpeed, windGust, beachOrientation)
    
    let total = waveScore + windScore
    
    // === Conditions-based caps (universal) ===
    
    // Very windy
    if (gustMph > 30 || windMph > 25) {
      total = Math.min(total, 25)
    } else if (gustMph > 25 || windMph > 20) {
      total = Math.min(total, 40)
    }
    
    // Short period + wind = messy
    if (period < 5 && windMph > 12) {
      total = Math.min(total, config.periodCap?.under5 || 35)
    }
    
    // Chop dominant — but only penalize if wind is onshore/cross-shore
    // When wind is offshore, "wind waves" in forecast data are generated offshore
    // and arrive as clean energy, not local chop
    const offshoreDir = (beachOrientation + 180) % 360
    const windOff = angleDiff(windDirection ?? 0, offshoreDir)
    const isOffshore = windDirection != null && windOff <= 60
    
    if (!isOffshore) {
      if (windChopFt > swellFt * 1.5 && swellFt < 1.5) {
        total = Math.min(total, 35)
      }
      if (windChopFt > swellFt * 2) {
        total = Math.min(total, 30)
      }
    }
    
    // === Height-based caps — region-aware ===
    if (config.coastType === 'west') {
      // West Coast: ground swell surfs bigger than measured
      let surfingHeight = effectiveHeight
      if (period >= 10) {
        surfingHeight = effectiveHeight * (1 + (period - 9) * 0.12)
      }
      
      if (surfingHeight < 1) total = Math.min(total, 20)
      else if (surfingHeight < 1.5) total = Math.min(total, 30)
      else if (surfingHeight <= 2) total = Math.min(total, 40)
      else if (surfingHeight < 2.5) total = Math.min(total, 50)
      else if (surfingHeight < 3) total = Math.min(total, 60)
    } else if (config.heightCaps) {
      // East Coast regions: use region-specific height caps
      const caps = config.heightCaps
      const sortedHeights = Object.keys(caps).map(Number).sort((a, b) => a - b)
      
      for (const ht of sortedHeights) {
        if (effectiveHeight < ht) {
          total = Math.min(total, caps[ht])
          break
        }
        // If effectiveHeight equals the last cap threshold
        if (ht === sortedHeights[sortedHeights.length - 1] && effectiveHeight <= ht) {
          total = Math.min(total, caps[ht])
        }
      }
    }
    
    // Period-based caps — region-aware
    if (period < 3) {
      total = Math.min(total, 20)  // truly unsurfable chop
    } else if (period < 4) {
      // 3-4s: Florida regions tolerate this, others don't
      const sub4Cap = ['florida_ne', 'florida_se', 'gulf'].includes(effectiveRegion) ? 40 : 25
      total = Math.min(total, sub4Cap)
    } else if (period < 5) {
      total = Math.min(total, config.periodCap?.under5 || 35)
    }
    
    // Combined small + short period — region-aware
    if (effectiveHeight <= 2 && period < 5) {
      total = Math.min(total, config.smallComboMax?.under5 || 25)
    } else if (effectiveHeight <= 2 && period < 6) {
      total = Math.min(total, config.smallComboMax?.under6 || 35)
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
    if (score >= 40) return 'Good'
    if (score >= 12) return 'Junky'
    return 'Flat'
  }
  
  const scoreToColor = (score) => {
    if (score >= 70) return '#10b981'  // Epic - Emerald
    if (score >= 40) return '#3b82f6'  // Good - Blue
    if (score >= 12) return '#fb7185'  // Junky - Rose
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
    formatDirection,
    getRegionConfig,
    REGION_CONFIG
  }
}
