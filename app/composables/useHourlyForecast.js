// composables/useHourlyForecast.js
// Fetches detailed hourly forecast with all swell components

export const useHourlyForecast = () => {
    const hourlyData = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const sunData = ref(null)

    const fetchHourlyForecast = async (lat, lng, date) => {
        loading.value = true
        error.value = null

        try {
            const dateStr = new Date(date).toISOString().split('T')[0]

            // Fetch ALL swell components
            const marineParams = [
                'wave_height',
                'wave_period',
                'wave_direction',
                'wind_wave_height',
                'wind_wave_period',
                'wind_wave_direction',
                'swell_wave_height',
                'swell_wave_period',
                'swell_wave_direction',
                'secondary_swell_wave_height',
                'secondary_swell_wave_period',
                'secondary_swell_wave_direction'
            ].join(',')

            const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=${marineParams}&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`

            const [marineRes, weatherRes] = await Promise.all([
                fetch(marineUrl),
                fetch(weatherUrl)
            ])

            const marineData = await marineRes.json()
            const weatherData = await weatherRes.json()

            sunData.value = {
                sunrise: weatherData.daily?.sunrise?.[0] || null,
                sunset: weatherData.daily?.sunset?.[0] || null
            }

            const m = marineData.hourly
            const w = weatherData.hourly

            const hours = m.time.map((time, i) => {
                // Convert meters to feet for all height values
                const toFeet = (meters) => meters ? parseFloat((meters * 3.28084).toFixed(1)) : null
                
                return {
                    time: new Date(time),
                    hour: new Date(time).getHours(),
                    
                    // Combined totals (for headline display)
                    waveHeight: toFeet(m.wave_height?.[i]),
                    wavePeriod: m.wave_period?.[i] ? parseFloat(m.wave_period[i].toFixed(0)) : null,
                    waveDirection: m.wave_direction?.[i] || null,
                    
                    // Wind waves (local chop)
                    windWaveHeight: toFeet(m.wind_wave_height?.[i]),
                    windWavePeriod: m.wind_wave_period?.[i] ? parseFloat(m.wind_wave_period[i].toFixed(0)) : null,
                    windWaveDirection: m.wind_wave_direction?.[i] || null,
                    
                    // Primary swell (ground swell)
                    swellWaveHeight: toFeet(m.swell_wave_height?.[i]),
                    swellWavePeriod: m.swell_wave_period?.[i] ? parseFloat(m.swell_wave_period[i].toFixed(0)) : null,
                    swellWaveDirection: m.swell_wave_direction?.[i] || null,
                    
                    // Secondary swell
                    secondarySwellHeight: toFeet(m.secondary_swell_wave_height?.[i]),
                    secondarySwellPeriod: m.secondary_swell_wave_period?.[i] ? parseFloat(m.secondary_swell_wave_period[i].toFixed(0)) : null,
                    secondarySwellDirection: m.secondary_swell_wave_direction?.[i] || null,
                    
                    // Wind (convert km/h to mph)
                    windSpeed: w.wind_speed_10m?.[i] ? Math.round(w.wind_speed_10m[i] * 0.621371) : null,
                    windGust: w.wind_gusts_10m?.[i] ? Math.round(w.wind_gusts_10m[i] * 0.621371) : null,
                    windDirection: w.wind_direction_10m?.[i] || null
                }
            })

            // Filter to surfable hours (5am - 9pm)
            hourlyData.value = hours.filter(h => h.hour >= 5 && h.hour <= 21)

        } catch (e) {
            error.value = e.message
            hourlyData.value = null
            sunData.value = null
        } finally {
            loading.value = false
        }
    }

    const formatHour = (hour) => {
        if (hour === 0) return '12a'
        if (hour === 12) return '12p'
        if (hour < 12) return `${hour}a`
        return `${hour - 12}p`
    }

    return {
        hourlyData,
        sunData,
        loading,
        error,
        fetchHourlyForecast,
        formatHour
    }
}
