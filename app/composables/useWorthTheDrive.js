// composables/useWorthTheDrive.js
// Worth the Drive score + Better Conditions Nearby
//
// WTD tiers:
//   🔥 Send It  — peakRating ≥ 70, cleanWindow ≥ 4hrs
//   🤙 Worth It — peakRating ≥ 40, cleanWindow ≥ 2hrs
//   🏠 Stay Local — peakRating 12-39 or window < 2hrs
//   😴 Skip It  — flat (peakRating < 12)

export const useWorthTheDrive = () => {

  const { calculateRating, scoreToLabel } = useHowzitRating()

  /**
   * Compute WTD from forecast rows (from Supabase forecasts table).
   * Looks at the next 14 hours of hourly data.
   */
  const analyzeWorthTheDrive = (forecasts, beachOrientation = 90, surfRegion = 'mid_atlantic') => {
    if (!forecasts?.length) return null

    const now = new Date()
    const cutoff = new Date(now.getTime() + 14 * 60 * 60 * 1000)

    // Compute hourly ratings for the next 14 hours
    const hourlyRatings = forecasts
      .filter(f => {
        const t = new Date(f.timestamp)
        return t >= now && t <= cutoff
      })
      .map(f => {
        const score = calculateRating({
          waveHeight: f.blended_wave_height ?? f.wave_height,
          wavePeriod: f.blended_wave_period ?? f.wave_period,
          waveDirection: f.blended_wave_direction ?? f.wave_direction,
          swellWaveHeight: f.swell_wave_height,
          swellWavePeriod: f.swell_wave_period,
          swellWaveDirection: f.swell_wave_direction,
          windWaveHeight: f.wind_wave_height,
          windWavePeriod: f.wind_wave_period,
          windSpeed: f.wind_speed,
          windDirection: f.wind_direction,
          windGust: f.wind_gust,
          beachOrientation,
          surfRegion
        })
        return { timestamp: f.timestamp, score }
      })

    if (!hourlyRatings.length) return null

    const peakRating = Math.max(...hourlyRatings.map(h => h.score))

    // Find longest consecutive run of "good" hours (rating ≥ 40)
    let bestGoodRun = 0, goodStart = null, goodEnd = null
    let run = 0, runStart = null
    for (const hr of hourlyRatings) {
      if (hr.score >= 40) {
        if (run === 0) runStart = hr.timestamp
        run++
        if (run > bestGoodRun) {
          bestGoodRun = run
          goodStart = runStart
          goodEnd = hr.timestamp
        }
      } else {
        run = 0
        runStart = null
      }
    }

    // If no "good" window, find longest "surfable" run (rating ≥ 20)
    let surfableRun = 0, surfStart = null, surfEnd = null
    if (bestGoodRun === 0) {
      run = 0; runStart = null
      for (const hr of hourlyRatings) {
        if (hr.score >= 20) {
          if (run === 0) runStart = hr.timestamp
          run++
          if (run > surfableRun) {
            surfableRun = run
            surfStart = runStart
            surfEnd = hr.timestamp
          }
        } else {
          run = 0; runStart = null
        }
      }
    }

    const windowHours = bestGoodRun || surfableRun
    const windowStart = goodStart || surfStart
    const windowEnd = goodEnd || surfEnd

    // Determine swell consistency (std dev of wave heights)
    const heights = forecasts
      .filter(f => new Date(f.timestamp) >= now && new Date(f.timestamp) <= cutoff)
      .map(f => (f.blended_wave_height ?? f.wave_height) || 0)
    const avgHeight = heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length : 0
    const variance = heights.length ? heights.reduce((sum, h) => sum + (h - avgHeight) ** 2, 0) / heights.length : 0
    const swellConsistent = Math.sqrt(variance) < 0.3 // meters

    // Build factors array for the detail row
    const factors = []
    factors.push({
      label: `Rating: ${peakRating}`,
      status: peakRating >= 70 ? 'green' : peakRating >= 40 ? 'yellow' : 'red'
    })
    if (windowHours > 0) {
      const windowStr = formatWindowShort(windowStart, windowEnd)
      factors.push({
        label: `Window: ${windowStr}`,
        status: windowHours >= 4 ? 'green' : windowHours >= 2 ? 'yellow' : 'red'
      })
    }
    factors.push({
      label: swellConsistent ? 'Consistent swell' : 'Variable swell',
      status: swellConsistent ? 'green' : 'yellow'
    })

    // Determine tier
    let tier, label, icon, description, color

    if (peakRating < 12) {
      tier = 'skip'; label = 'Skip It'; icon = '😴'
      description = 'Nothing rideable right now.'
      color = '#9ca3af'
    } else if (peakRating >= 70 && windowHours >= 4) {
      tier = 'send'; label = 'Send It'; icon = '🔥'
      const windowStr = formatWindowShort(windowStart, windowEnd)
      description = `Long-period swell with a ${windowHours}hr+ clean window (${windowStr}). This is the day you drive for.`
      color = '#10b981'
    } else if (peakRating >= 40 && windowHours >= 2) {
      tier = 'worth'; label = 'Worth It'; icon = '🤙'
      const windowStr = formatWindowShort(windowStart, windowEnd)
      description = `Clean conditions with a ${windowHours}hr window (${windowStr}). Worth the paddle.`
      color = '#fbbf24'
    } else {
      tier = 'local'; label = 'Stay Local'; icon = '🏠'
      if (windowHours > 0) {
        description = `Short ${windowHours}hr window. If you're already here, go for it. Otherwise, save the gas.`
      } else {
        description = 'Choppy, weak, or blown out all day. For the dedicated only.'
      }
      color = '#ef4444'
    }

    return {
      tier, label, icon, description, color, factors,
      peakRating, hours: windowHours,
      start: windowStart, end: windowEnd
    }
  }

  /**
   * Format a time window as "6AM-2PM"
   */
  const formatWindowShort = (start, end) => {
    if (!start || !end) return ''
    const fmt = (ts) => {
      const d = new Date(ts)
      const h = d.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
      return `${hr}${ampm}`
    }
    return `${fmt(start)}-${fmt(end)}`
  }

  /**
   * Haversine distance between two points in miles
   */
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  /**
   * Rank spots by current conditions, return top N that are better than current.
   * 
   * @param {Array} allSpots — raw rows from get_all_spot_current_conditions RPC
   * @param {Object} currentSpot — the spot being viewed  
   * @param {Number} currentScore — current spot's rating score
   * @param {Number} count — how many to return
   */
  const getBetterConditions = (allSpots, currentSpot, currentScore, count = 3) => {
    if (!allSpots?.length || !currentSpot) return []

    return allSpots
      .filter(s => s.id !== currentSpot.id && s.wave_height != null)
      .map(s => {
        // Compute rating from raw forecast data
        const score = calculateRating({
          waveHeight: s.blended_wave_height ?? s.wave_height,
          wavePeriod: s.blended_wave_period ?? s.wave_period,
          waveDirection: s.blended_wave_direction ?? s.wave_direction,
          swellWaveHeight: s.swell_wave_height,
          swellWavePeriod: s.swell_wave_period,
          swellWaveDirection: s.swell_wave_direction,
          windWaveHeight: s.wind_wave_height,
          windWavePeriod: s.wind_wave_period,
          windSpeed: s.wind_speed,
          windDirection: s.wind_direction,
          windGust: s.wind_gust,
          beachOrientation: s.orientation || 90,
          surfRegion: s.surf_region || 'mid_atlantic'
        })
        return {
          ...s,
          score,
          distance: haversineDistance(
            currentSpot.latitude, currentSpot.longitude,
            s.latitude, s.longitude
          ),
          label: scoreToLabel(score)
        }
      })
      .filter(s => s.score > currentScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
  }

  return {
    analyzeWorthTheDrive,
    getBetterConditions,
    haversineDistance,
    formatWindowShort
  }
}
