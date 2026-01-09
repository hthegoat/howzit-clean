<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 overflow-x-hidden">
      <div v-if="!spot" class="text-gray-500 px-2">Loading...</div>

      <div v-else>
        <div class="grid lg:grid-cols-3 gap-4 sm:gap-6">
          
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            <SpotHero 
              :spot-name="spot.name"
              :state="spot.state"
              :region="spot.region"
              :buoy-id="spot.buoy_id"
              :current="currentConditions"
              :rating="currentRating"
              :rating-label="ratingLabel"
              :timestamp="latestForecast?.fetched_at"
              :tide-state="tideState"
              :today-tides="todayTidesFiltered"
              :sunrise="sunTimes?.sunrise"
              :sunset="sunTimes?.sunset"
              :beach-orientation="beachOrientation"
              :hourly-data="todayHourlyData"
              @feedback="handleFeedback"
            />

            <!-- Surf Graph -->
            <SurfGraph 
              v-if="surflineForecasts.length"
              :forecasts="surflineForecasts"
              :beach-orientation="beachOrientation"
              :tides="surflineTides"
              @hover="graphHoverTime = $event"
              @hover-end="graphHoverTime = null"
            />

            <!-- Tide Forecast Graph -->
            <TideForecastGraph 
              v-if="surflineTides.length && surflineForecasts.length"
              :tides="surflineTides"
              :forecasts="surflineForecasts"
              :hover-time="graphHoverTime"
            />

            <!-- Best Time to Surf -->
            <BestTimeCard 
              :hourly-data="todayHourlyData"
              :tides="surflineTides"
              :beach-orientation="beachOrientation"
            />

            <!-- Today's Tide card removed - info now in SpotHero -->

            <!-- Hourly for selected day (not today) -->
            <HourlyDetail 
              v-if="selectedDay && selectedDay.dayName !== 'Today'"
              :day="selectedDay"
              :hourly-data="hourlyData"
              :beach-orientation="beachOrientation"
            />

            <SpotHistory :spot="spot" />

            <SpotAbout :spot="spot" />
          </div>

          <!-- Right Column -->
          <div class="space-y-4 sm:space-y-6 min-w-0">
            <WeekOutlook :summary="spotSummary" />
            <SpotInfoCard :info="spotInfo" />
            <Hazards :hazards="hazards" />
            <NearbySpots :spots="nearbySpots" :current-slug="spot.slug" />
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const route = useRoute()
const supabase = useSupabaseClient()

// Composables
const { hourlyData, fetchHourlyForecast } = useHourlyForecast()
const { hourlyData: todayHourlyData, fetchHourlyForecast: fetchTodayHourly } = useHourlyForecast()
const { calculateRating, scoreToStars, scoreToLabel } = useHowzitRating()

// Refs
const spot = ref(null)
const surflineForecasts = ref([])
const surflineTides = ref([])
const buoyReading = ref(null)
const spotSummary = ref(null)
const selectedDay = ref(null)
const nearbySpots = ref([])
const graphHoverTime = ref(null)

// Fetch spot data
const { data } = await useAsyncData(`spot-${route.params.slug}`, async () => {
  const { data: spotData } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', route.params.slug)
    .single()
  return spotData
})
spot.value = data.value

// Beach orientation (default 90 = east facing)
const beachOrientation = computed(() => spot.value?.orientation || 90)

// Feedback handler
const handleFeedback = (accurate) => {
  console.log('Feedback:', { spot: spot.value?.slug, rating: ratingLabel.value, accurate })
  // TODO: Save to DB later
}

// Helper functions
const formatDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return '--'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

const formatWaveRange = (min, max) => {
  if (!isFinite(min) || !isFinite(max)) return '--'
  const minRound = Math.max(1, Math.round(min))
  const maxRound = Math.max(1, Math.round(max))
  if (minRound === maxRound) return `${minRound}ft`
  return `${minRound}-${maxRound}ft`
}

const selectDay = async (day) => {
  if (!day) return
  if (selectedDay.value?.dayName === day.dayName) {
    selectedDay.value = null
    return
  }
  selectedDay.value = day
  await fetchHourlyForecast(spot.value.latitude, spot.value.longitude, day.date)
}

// Computed
const latestForecast = computed(() => surflineForecasts.value[0] || null)

// Use buoy data for current conditions when available, fallback to forecast
const currentConditions = computed(() => {
  const buoy = buoyReading.value
  const f = latestForecast.value
  
  if (!f && !buoy) {
    return {
      height: '--',
      period: '--',
      swellDirection: null,
      wind: { speed: '--', direction: '--', degrees: null },
      temp: '--',
      source: null
    }
  }

  // Use forecast data for display (Open-Meteo)
  // Buoy data is used for rating calculation but not display
  const hasBuoyWaves = false // Disabled: buoy?.wave_height != null
  
  let waveHeightFt, period, swellDir
  
  if (hasBuoyWaves) {
    // Use buoy data - wave_height is in meters
    waveHeightFt = Math.round(buoy.wave_height * 3.281)
    // Prefer swell_period if available, otherwise dominant_period
    period = buoy.swell_period || buoy.dominant_period || '--'
    swellDir = buoy.swell_direction ?? buoy.wave_direction ?? null
  } else if (f) {
    // Fallback to Open-Meteo forecast
    waveHeightFt = f.wave_height ? Math.round(f.wave_height * 3.281) : 0
    
    // Determine which period to show based on dominant component
    // Blend swell and wind wave periods weighted by their heights
    const swellH = f.swell_wave_height || 0
    const windH = f.wind_wave_height || 0
    const swellP = f.swell_wave_period || 0
    const windP = f.wind_wave_period || 0
    
    if (swellH > 0 && windH > 0 && swellP > 0 && windP > 0) {
      // Weighted average of periods by wave height
      const totalH = swellH + windH
      const blendedPeriod = (swellP * swellH + windP * windH) / totalH
      period = Math.round(blendedPeriod)
    } else if (f.swell_wave_period) {
      period = Math.round(f.swell_wave_period)
    } else {
      period = f.wave_period ? Math.round(f.wave_period) : '--'
    }
    
    swellDir = f.swell_wave_direction ?? f.wave_direction ?? null
  }

  // Wind - use buoy if fresh, otherwise forecast
  // Buoy wind_speed is in m/s, forecast is km/h
  let windMph, windDir, windDegrees
  if (buoy?.wind_speed != null) {
    // Buoy wind is m/s, convert to mph (m/s * 2.237)
    windMph = Math.round(buoy.wind_speed * 2.237)
    windDegrees = buoy.wind_direction ?? null
    windDir = windDegrees != null ? formatDirection(windDegrees) : '--'
  } else if (f) {
    // Forecast wind is km/h, convert to mph
    windMph = f.wind_speed ? Math.round(f.wind_speed * 0.621) : '--'
    windDegrees = f.wind_direction ?? null
    windDir = windDegrees != null ? formatDirection(windDegrees) : '--'
  }

  // Water temp - prefer buoy (actual measurement)
  let waterTempF = '--'
  if (buoy?.water_temp != null) {
    // Buoy water_temp is in Celsius
    waterTempF = Math.round((buoy.water_temp * 9/5) + 32)
  } else if (f?.sea_surface_temp != null) {
    waterTempF = Math.round((f.sea_surface_temp * 9/5) + 32)
  }

  return {
    height: waveHeightFt > 0 ? `${Math.max(1, waveHeightFt - 1)}-${waveHeightFt + 1}` : '--',
    period: period,
    swellDirection: swellDir,
    wind: { speed: windMph, direction: windDir, degrees: windDegrees },
    temp: waterTempF,
    source: hasBuoyWaves ? 'buoy' : 'forecast'
  }
})

// Howzit Rating - use buoy data for current conditions when available
const currentRatingScore = computed(() => {
  const buoy = buoyReading.value
  const f = latestForecast.value
  
  if (!f && !buoy) return 0
  
  // Use forecast data for rating (Open-Meteo)
  // Buoy data disabled - Open-Meteo more accurate for this area
  const hasBuoyWaves = false // Disabled: buoy?.wave_height != null
  
  // Build rating params - prefer buoy for waves, use forecast for wind if buoy wind unavailable
  const params = {
    beachOrientation: beachOrientation.value
  }
  
  if (hasBuoyWaves) {
    // Use buoy wave data
    params.waveHeight = buoy.wave_height
    params.wavePeriod = buoy.dominant_period
    params.waveDirection = buoy.wave_direction
    // Buoy may have separated swell components
    params.swellWaveHeight = buoy.swell_height
    params.swellWavePeriod = buoy.swell_period
    params.swellWaveDirection = buoy.swell_direction
    params.windWaveHeight = buoy.wind_wave_height
    params.windWavePeriod = buoy.wind_wave_period
    params.windWaveDirection = buoy.wind_wave_direction
  } else if (f) {
    // Use forecast wave data
    params.waveHeight = f.wave_height
    params.wavePeriod = f.wave_period
    params.waveDirection = f.wave_direction
    params.swellWaveHeight = f.swell_wave_height
    params.swellWavePeriod = f.swell_wave_period
    params.swellWaveDirection = f.swell_wave_direction
    params.windWaveHeight = f.wind_wave_height
    params.windWavePeriod = f.wind_wave_period
    params.windWaveDirection = f.wind_wave_direction
    params.secondarySwellHeight = f.secondary_swell_height
    params.secondarySwellPeriod = f.secondary_swell_period
    params.secondarySwellDirection = f.secondary_swell_direction
  }
  
  // Wind - prefer buoy, fallback to forecast
  // Note: buoy wind is m/s, forecast is km/h - algorithm expects km/h
  if (buoy?.wind_speed != null) {
    // Convert buoy m/s to km/h for algorithm
    params.windSpeed = buoy.wind_speed * 3.6
    params.windDirection = buoy.wind_direction
    params.windGust = buoy.wind_gust ? buoy.wind_gust * 3.6 : null
  } else if (f) {
    params.windSpeed = f.wind_speed
    params.windDirection = f.wind_direction
    params.windGust = f.wind_gust
  }
  
  return calculateRating(params)
})

const currentRating = computed(() => scoreToStars(currentRatingScore.value))
const ratingLabel = computed(() => scoreToLabel(currentRatingScore.value))

const displayForecast = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  
  const byDay = {}
  surflineForecasts.value.forEach(f => {
    const date = new Date(f.timestamp).toDateString()
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(f)
  })

  // Helper to average an array of numbers
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const validNums = (readings, key) => readings.map(r => r[key]).filter(v => v !== null && v !== undefined)

  const dailyData = Object.entries(byDay).map(([dateStr, readings]) => {
    const date = new Date(dateStr)
    const isToday = date.toDateString() === today.toDateString()
    
    // Skip today - it has its own section
    if (isToday) return null
    
    // Get wave heights in feet (convert from meters)
    const waveHeights = readings.map(r => r.wave_height ? r.wave_height * 3.281 : null).filter(v => v !== null)
    const waveMin = waveHeights.length ? Math.min(...waveHeights) : 0
    const waveMax = waveHeights.length ? Math.max(...waveHeights) : 0
    
    // Average all the swell components (keep in meters for algorithm)
    const avgWaveHeight = avg(validNums(readings, 'wave_height'))
    const avgWavePeriod = avg(validNums(readings, 'wave_period'))
    const avgWaveDir = avg(validNums(readings, 'wave_direction'))
    const avgSwellHeight = avg(validNums(readings, 'swell_wave_height'))
    const avgSwellPeriod = avg(validNums(readings, 'swell_wave_period'))
    const avgSwellDir = avg(validNums(readings, 'swell_wave_direction'))
    const avgWindWaveHeight = avg(validNums(readings, 'wind_wave_height'))
    const avgWindWavePeriod = avg(validNums(readings, 'wind_wave_period'))
    const avgWindWaveDir = avg(validNums(readings, 'wind_wave_direction'))
    const avgSecondaryHeight = avg(validNums(readings, 'secondary_swell_height'))
    const avgSecondaryPeriod = avg(validNums(readings, 'secondary_swell_period'))
    const avgSecondaryDir = avg(validNums(readings, 'secondary_swell_direction'))
    const avgWindSpeed = avg(validNums(readings, 'wind_speed'))
    const avgWindDir = avg(validNums(readings, 'wind_direction'))
    const avgWindGust = avg(validNums(readings, 'wind_gust'))
    
    // Calculate Howzit rating with full swell data
    const score = calculateRating({
      waveHeight: avgWaveHeight,
      wavePeriod: avgWavePeriod,
      waveDirection: avgWaveDir,
      swellWaveHeight: avgSwellHeight,
      swellWavePeriod: avgSwellPeriod,
      swellWaveDirection: avgSwellDir,
      windWaveHeight: avgWindWaveHeight,
      windWavePeriod: avgWindWavePeriod,
      windWaveDirection: avgWindWaveDir,
      secondarySwellHeight: avgSecondaryHeight,
      secondarySwellPeriod: avgSecondaryPeriod,
      secondarySwellDirection: avgSecondaryDir,
      windSpeed: avgWindSpeed,
      windDirection: avgWindDir,
      windGust: avgWindGust,
      beachOrientation: beachOrientation.value
    })

    return {
      date,
      dayName: days[date.getDay()],
      waveDisplay: formatWaveRange(waveMin, waveMax),
      period: avgSwellPeriod ? Math.round(avgSwellPeriod) : (avgWavePeriod ? Math.round(avgWavePeriod) : '--'),
      windSpeed: avgWindSpeed ? Math.round(avgWindSpeed * 0.621) : '--',
      stars: scoreToStars(score),
      score
    }
  }).filter(Boolean) // Remove nulls (today)

  return dailyData.sort((a, b) => a.date - b.date).slice(0, 5)
})

const spotInfo = computed(() => ({
  skill_level: 'All levels',
  best_tide: 'Mid to High',
  best_swell_direction: ['E', 'ESE', 'SE'],
  best_wind_direction: ['W', 'NW']
}))

const hazards = computed(() => {
  const h = []
  const f = latestForecast.value
  if (!f) return h
  // Convert km/h to mph
  const windMph = f.wind_speed ? f.wind_speed * 0.621 : 0
  // Convert meters to feet
  const waveHeightFt = f.wave_height ? f.wave_height * 3.281 : 0
  if (windMph > 20) h.push('Strong winds - use caution')
  if (waveHeightFt > 8) h.push('Large surf - experienced surfers only')
  return h
})

// Tide state - rising/falling and time until next
const todayTidesFiltered = computed(() => {
  if (!surflineTides.value?.length) return []
  
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  
  return surflineTides.value
    .filter(t => {
      const tideDate = new Date(t.timestamp)
      return tideDate >= todayStart && tideDate < todayEnd
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
})

const tideState = computed(() => {
  if (!surflineTides.value?.length) return null
  
  const now = Date.now()
  
  // Get all tides sorted by time
  const allTides = surflineTides.value
    .map(t => ({ ...t, time: new Date(t.timestamp).getTime() }))
    .sort((a, b) => a.time - b.time)
  
  // Find the next tide after now
  const nextTide = allTides.find(t => t.time > now)
  if (!nextTide) return null
  
  // If next tide is HIGH, we're rising. If LOW, we're falling
  const rising = nextTide.type === 'HIGH'
  
  // Calculate time until next tide
  const msUntil = nextTide.time - now
  const hoursUntil = Math.floor(msUntil / (1000 * 60 * 60))
  const minsUntil = Math.floor((msUntil % (1000 * 60 * 60)) / (1000 * 60))
  
  let timeUntil = ''
  if (hoursUntil > 0) {
    timeUntil = `${hoursUntil}h ${minsUntil}m`
  } else {
    timeUntil = `${minsUntil}m`
  }
  
  return {
    rising,
    nextType: nextTide.type === 'HIGH' ? 'High' : 'Low',
    timeUntil
  }
})

// Sun times
const sunTimes = ref(null)

// No auto-select - user clicks to expand future days

// Fetch data on mount
onMounted(async () => {
  if (spot.value?.id) {
    // Summary
    const { data: summary } = await supabase
      .from('spot_summaries')
      .select('summary, generated_at')
      .eq('spot_id', spot.value.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()
    spotSummary.value = summary

    // Forecasts - now from 'forecasts' table (Open-Meteo)
    const now = new Date()
    const sixDaysOut = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
    const { data: forecastData } = await supabase
      .from('forecasts')
      .select('*')
      .eq('spot_id', spot.value.id)
      .gte('timestamp', now.toISOString())
      .lte('timestamp', sixDaysOut.toISOString())
      .order('timestamp', { ascending: true })
    surflineForecasts.value = forecastData || []

    // Tides - now from 'tides' table (NOAA CO-OPS)
    // Fetch enough to cover full forecast period (7+ days)
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    const eightDaysOut = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)
    const { data: tideData } = await supabase
      .from('tides')
      .select('*')
      .eq('spot_id', spot.value.id)
      .gte('timestamp', oneDayAgo.toISOString())
      .lte('timestamp', eightDaysOut.toISOString())
      .order('timestamp', { ascending: true })
    surflineTides.value = tideData || []

    // Buoy
    if (spot.value.buoy_id) {
      const { data: buoyData } = await supabase
        .from('buoy_readings')
        .select('*')
        .eq('buoy_id', spot.value.buoy_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
      buoyReading.value = buoyData
    }

    // Nearby spots
    const { data: allSpots } = await supabase
      .from('spots')
      .select('name, slug')
      .eq('state', spot.value.state)
      .neq('slug', spot.value.slug)
      .limit(4)
    nearbySpots.value = (allSpots || []).map(s => ({
      name: s.name,
      slug: s.slug,
      distance: 'Nearby'
    }))

    // Fetch today's hourly data and sun times
    if (spot.value.latitude && spot.value.longitude) {
      await fetchTodayHourly(spot.value.latitude, spot.value.longitude, new Date())
      
      // Fetch sunrise/sunset
      try {
        const today = new Date().toISOString().split('T')[0]
        const sunRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${spot.value.latitude}&longitude=${spot.value.longitude}&daily=sunrise,sunset&timezone=auto&start_date=${today}&end_date=${today}`
        )
        const sunData = await sunRes.json()
        if (sunData.daily) {
          const formatSunTime = (iso) => {
            const d = new Date(iso)
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
          sunTimes.value = {
            sunrise: formatSunTime(sunData.daily.sunrise[0]),
            sunset: formatSunTime(sunData.daily.sunset[0])
          }
        }
      } catch (e) {
        console.error('Failed to fetch sun times:', e)
      }
    }
  }
})

// SEO
const siteUrl = 'https://howzit.surf'

const metaDescription = computed(() => {
  if (!spot.value) return ''
  const f = latestForecast.value
  if (f) {
    const height = f.wave_height ? `${Math.round(f.wave_height * 3.281)}ft` : ''
    return `${spot.value.name} surf report: ${height} waves, ${ratingLabel.value} conditions. Live forecast, tides, and wind for ${spot.value.region}, ${spot.value.state}.`
  }
  return `${spot.value.name} surf report and forecast. Live wave heights, wind, tides, and conditions for ${spot.value.region}, ${spot.value.state}.`
})

const canonicalUrl = computed(() => 
  spot.value ? `${siteUrl}/spots/${spot.value.slug}` : ''
)

// JSON-LD structured data for SEO
const jsonLd = computed(() => {
  if (!spot.value) return null
  
  const f = latestForecast.value
  const waveHeight = f?.wave_height ? Math.round(f.wave_height * 3.281) : null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${spot.value.name} Surf Report`,
    description: metaDescription.value,
    url: canonicalUrl.value,
    mainEntity: {
      '@type': 'Beach',
      name: spot.value.name,
      description: spot.value.description || `Surf spot in ${spot.value.region}, ${spot.value.state}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: spot.value.latitude,
        longitude: spot.value.longitude
      },
      address: {
        '@type': 'PostalAddress',
        addressRegion: spot.value.state,
        addressLocality: spot.value.region,
        addressCountry: 'US'
      }
    },
    ...(waveHeight && {
      mainContentOfPage: {
        '@type': 'WebPageElement',
        name: 'Current Conditions',
        text: `Wave height: ${waveHeight}ft, Conditions: ${ratingLabel.value}`
      }
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Howzit',
      url: 'https://howzit.surf'
    }
  }
})

useHead({
  title: computed(() => spot.value ? `${spot.value.name}, ${spot.value.state} Surf Report & Forecast - Howzit` : 'Loading...'),
  meta: [
    { name: 'description', content: metaDescription },
    { property: 'og:title', content: computed(() => spot.value ? `${spot.value.name}, ${spot.value.state} Surf Report & Forecast - Howzit` : '') },
    { property: 'og:description', content: metaDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonicalUrl },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: computed(() => spot.value ? `${spot.value.name}, ${spot.value.state} Surf Report & Forecast - Howzit` : '') },
    { name: 'twitter:description', content: metaDescription },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => jsonLd.value ? JSON.stringify(jsonLd.value) : '')
    }
  ]
})
</script>
