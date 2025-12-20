// composables/useMarineForecast.js

export const useMarineForecast = () => {

  const getPeriodFactor = (period) => {
    if (!period || period < 6) return 0.20
    if (period < 9) return 0.30
    if (period < 12) return 0.40
    return 0.50
  }

  const getDirectionFactor = (beachOrientation, swellDirection) => {
    if (beachOrientation === null || swellDirection === null) return 1.0
    const idealSwellDir = beachOrientation
    let angleDiff = Math.abs(swellDirection - idealSwellDir)
    if (angleDiff > 180) angleDiff = 360 - angleDiff
    if (angleDiff <= 30) return 1.0
    if (angleDiff <= 60) return 0.80
    if (angleDiff <= 90) return 0.50
    return 0.25
  }

  const metersToFeet = (m) => m * 3.28084

  const calculateBeachWaveHeight = (offshoreHeightMeters, period, swellDirection, beachOrientation) => {
    const periodFactor = getPeriodFactor(period)
    const directionFactor = getDirectionFactor(beachOrientation, swellDirection)
    return offshoreHeightMeters * periodFactor * directionFactor
  }

  const fetchForecast = async (latitude, longitude, beachOrientation = 90) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: [
        'wave_height_max',
        'wave_period_max',
        'wave_direction_dominant',
        'swell_wave_height_max',
        'swell_wave_period_max',
        'swell_wave_direction_dominant'
      ].join(','),
      timezone: 'America/New_York',
      forecast_days: '7'
    })

    try {
      const response = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`)
      if (!response.ok) throw new Error(`Marine API error: ${response.status}`)
      const data = await response.json()

      const days = data.daily.time.map((date, index) => {
        const waveHeightRaw = data.daily.wave_height_max[index] || 0
        const wavePeriod = data.daily.wave_period_max[index] || 0
        const waveDir = data.daily.wave_direction_dominant[index]
        const swellHeightRaw = data.daily.swell_wave_height_max?.[index] || waveHeightRaw
        const swellPeriod = data.daily.swell_wave_period_max?.[index] || wavePeriod
        const swellDir = data.daily.swell_wave_direction_dominant?.[index] || waveDir

        const primaryHeight = swellHeightRaw || waveHeightRaw
        const primaryPeriod = swellPeriod || wavePeriod
        const primaryDir = swellDir || waveDir

        const beachWaveHeight = calculateBeachWaveHeight(primaryHeight, primaryPeriod, primaryDir, beachOrientation)

        return {
          date,
          waveHeight: beachWaveHeight,
          waveHeightFt: metersToFeet(beachWaveHeight),
          waveHeightRaw: primaryHeight,
          waveHeightRawFt: metersToFeet(primaryHeight),
          wavePeriod: primaryPeriod,
          waveDirection: primaryDir,
          swellDirection: swellDir,
          periodFactor: getPeriodFactor(primaryPeriod),
          directionFactor: getDirectionFactor(beachOrientation, primaryDir)
        }
      })

      return { success: true, data: days }
    } catch (error) {
      console.error('Marine forecast error:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  return { fetchForecast, calculateBeachWaveHeight, getPeriodFactor, getDirectionFactor }
}
