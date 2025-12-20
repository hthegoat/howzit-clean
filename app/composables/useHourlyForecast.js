// composables/useHourlyForecast.js

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

            const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
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

            const hours = marineData.hourly.time.map((time, i) => ({
                time: new Date(time),
                hour: new Date(time).getHours(),
                waveHeight: marineData.hourly.wave_height?.[i] ? (marineData.hourly.wave_height[i] * 3.28084).toFixed(1) : null,
                wavePeriod: marineData.hourly.wave_period?.[i]?.toFixed(0) || null,
                waveDirection: marineData.hourly.wave_direction?.[i] || null,
                swellHeight: marineData.hourly.swell_wave_height?.[i] ? (marineData.hourly.swell_wave_height[i] * 3.28084).toFixed(1) : null,
                swellPeriod: marineData.hourly.swell_wave_period?.[i]?.toFixed(0) || null,
                swellDirection: marineData.hourly.swell_wave_direction?.[i] || null,
                windSpeed: weatherData.hourly.wind_speed_10m?.[i] ? Math.round(weatherData.hourly.wind_speed_10m[i] * 0.621371) : null,
                windGust: weatherData.hourly.wind_gusts_10m?.[i] ? Math.round(weatherData.hourly.wind_gusts_10m[i] * 0.621371) : null,
                windDirection: weatherData.hourly.wind_direction_10m?.[i] || null
            }))

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
