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
              :spot-id="spot.id"
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
              :surf-region="surfRegion"
              :hourly-data="todayHourlyData"

              @feedback="handleFeedback"
            />

            <!-- Surf Graph -->
            <SurfGraph 
              v-if="surflineForecasts.length"
              :forecasts="surflineForecasts"
              :beach-orientation="beachOrientation"
              :surf-region="surfRegion"
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
              :surf-region="surfRegion"
            />

            <SpotHistory :spot="spot" />

            <SpotAbout :spot="spot" />

            <!-- FAQ Section -->
            <SpotFAQ
              :spot-name="spot.name"
              :state="spot.state"
              :water-temp="currentConditions.temp"
              :wave-height="currentConditions.height"
              :tides="surflineTides"
              :sunrise="sunTimes?.sunrise"
              :sunset="sunTimes?.sunset"
              :best-swell="spot.best_swell_direction"
              :best-wind="spot.best_wind_direction"
              :best-tide="spot.best_tide"
              :skill-level="spot.skill_level"
            />
          </div>

          <!-- Right Column -->
          <div class="space-y-4 sm:space-y-6 min-w-0">
            <WeekOutlook :summary="spotSummary" />
            <SpotInfoCard :info="spotInfo" />
            <Hazards :hazards="hazards" />
            <BetterConditions
              :spots="betterSpots"
              :current-label="ratingLabel"
            />
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
const { hourlyData: todayHourlyData, fetchHourlyForecast: fetchTodayHourly } = useHourlyForecast()
const { calculateRating, scoreToStars, scoreToLabel, formatDirection } = useHowzitRating()
const { getBetterConditions } = useWorthTheDrive()

// Refs
const graphHoverTime = ref(null)

// === SSR: Fetch ALL critical data server-side in a single useAsyncData call ===
const { data: ssrData } = await useAsyncData(`spot-full-${route.params.slug}`, async () => {
  // 1. Fetch spot
  const { data: spotData } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', route.params.slug)
    .single()
  
  if (!spotData) return null

  const now = new Date()
  const fourteenDaysOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  const sixteenDaysOut = new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000)

  // 2. Fetch forecasts, tides, buoy, summary, nearby in parallel
  const [forecastRes, tideRes, buoyRes, summaryRes, nearbyRes, allSpotsRes] = await Promise.all([
    // Forecasts
    supabase
      .from('forecasts')
      .select('*')
      .eq('spot_id', spotData.id)
      .gte('timestamp', now.toISOString())
      .lte('timestamp', fourteenDaysOut.toISOString())
      .order('timestamp', { ascending: true }),
    // Tides
    supabase
      .from('tides')
      .select('*')
      .eq('spot_id', spotData.id)
      .gte('timestamp', oneDayAgo.toISOString())
      .lte('timestamp', sixteenDaysOut.toISOString())
      .order('timestamp', { ascending: true }),
    // Buoy
    spotData.buoy_id
      ? supabase
          .from('buoy_readings')
          .select('*')
          .eq('buoy_id', spotData.buoy_id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()
      : Promise.resolve({ data: null }),
    // Summary
    supabase
      .from('spot_summaries')
      .select('summary, generated_at')
      .eq('spot_id', spotData.id)
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single(),
    // Nearby spots
    supabase
      .from('spots')
      .select('name, slug')
      .eq('state', spotData.state)
      .neq('slug', spotData.slug)
      .limit(4),
    // Better Conditions Nearby (region-scoped)
    supabase.rpc('get_better_conditions_nearby', { p_spot_id: spotData.id })
  ])

  return {
    spot: spotData,
    forecasts: forecastRes.data || [],
    tides: tideRes.data || [],
    buoy: buoyRes.data || null,
    summary: summaryRes.data || null,
    nearby: (nearbyRes.data || []).map(s => ({ name: s.name, slug: s.slug, distance: 'Nearby' })),
    betterNearby: allSpotsRes.data || []
  }
})

// Unpack SSR data into refs (reactive so client-side updates still work)
const spot = computed(() => ssrData.value?.spot || null)
const surflineForecasts = ref(ssrData.value?.forecasts || [])
const surflineTides = ref(ssrData.value?.tides || [])
const buoyReading = ref(ssrData.value?.buoy || null)
const spotSummary = ref(ssrData.value?.summary || null)
const nearbySpots = ref(ssrData.value?.nearby || [])

// Beach orientation (default 90 = east facing)
const beachOrientation = computed(() => spot.value?.orientation || 90)
const surfRegion = computed(() => spot.value?.surf_region || 'mid_atlantic')

// Feedback handler
const handleFeedback = async (accurate) => {
  try {
    await supabase.from('feedback').insert({
      spot_id: spot.value?.id,
      page_url: window.location.pathname,
      rating: accurate
    })
  } catch (e) {
    console.error('Feedback error:', e)
  }
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

  // Use blended forecast data when available, fallback to Open-Meteo
  const hasBuoyWaves = false // Disabled: buoy?.wave_height != null
  
  let waveHeightFt, period, swellDir
  
  if (hasBuoyWaves) {
    // Use buoy data - wave_height is in meters
    waveHeightFt = Math.round(buoy.wave_height * 3.281)
    // Prefer swell_period if available, otherwise dominant_period
    period = buoy.swell_period || buoy.dominant_period || '--'
    swellDir = buoy.swell_direction ?? buoy.wave_direction ?? null
  } else if (f) {
    // Use blended wave height if available, otherwise Open-Meteo
    const height = f.blended_wave_height ?? f.wave_height
    waveHeightFt = height ? Math.round(height * 3.281) : 0
    
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
    beachOrientation: beachOrientation.value,
    surfRegion: surfRegion.value
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
    // Use blended wave data when available, otherwise Open-Meteo
    params.waveHeight = f.blended_wave_height ?? f.wave_height
    params.wavePeriod = f.blended_wave_period ?? f.wave_period
    params.waveDirection = f.blended_wave_direction ?? f.wave_direction
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

// Better Conditions Nearby — pre-scored and region-scoped from DB
const betterSpots = computed(() => {
  const nearby = ssrData.value?.betterNearby || []
  if (!spot.value || !nearby.length) return []

  const { haversineDistance } = useWorthTheDrive()
  const { scoreToLabel } = useHowzitRating()

  return nearby.map(s => ({
    ...s,
    distance: haversineDistance(
      spot.value.latitude, spot.value.longitude,
      s.latitude, s.longitude
    ),
    label: scoreToLabel(s.condition_score)
  }))
})

const spotInfo = computed(() => ({
  skill_level: spot.value?.skill_level || 'All Levels',
  best_tide: spot.value?.best_tide || 'Mid',
  best_swell_direction: spot.value?.best_swell_direction || ['E', 'NE'],
  best_wind_direction: spot.value?.best_wind_direction || ['W', 'NW'],
  break_type: spot.value?.break_type || 'Beach Break',
  bottom_type: spot.value?.bottom_type || 'Sand',
  crowd_level: spot.value?.crowd_level || 'Moderate',
  parking_info: spot.value?.parking_info,
  local_tips: spot.value?.local_tips
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

// Client-only: fetch hourly detail data and sun times (not needed for SEO)
onMounted(async () => {
  if (spot.value?.latitude && spot.value?.longitude) {
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
})

// SEO
const siteUrl = 'https://hwztsurf.com'

const metaDescription = computed(() => {
  if (!spot.value) return ''
  const f = latestForecast.value
  if (f) {
    const h = f.blended_wave_height ?? f.wave_height
    const height = h ? `${Math.round(h * 3.281)}ft` : ''
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
  const h = f?.blended_wave_height ?? f?.wave_height
  const waveHeight = h ? Math.round(h * 3.281) : null
  
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
      url: 'https://hwztsurf.com'
    }
  }
})

// FAQ JSON-LD for rich snippets
const faqJsonLd = computed(() => {
  if (!spot.value) return null
  
  const faqs = []
  const name = spot.value.name
  
  // Water temp FAQ
  if (currentConditions.value.temp && currentConditions.value.temp !== '--') {
    faqs.push({
      '@type': 'Question',
      name: `What is the water temperature at ${name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `The current water temperature at ${name} is ${currentConditions.value.temp}°F.`
      }
    })
  }
  
  // Wave height FAQ
  if (currentConditions.value.height && currentConditions.value.height !== '--') {
    faqs.push({
      '@type': 'Question',
      name: `What is the surf like at ${name} today?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${name} currently has waves around ${currentConditions.value.height}. Conditions change throughout the day, so check back for updated forecasts.`
      }
    })
  }
  
  // Best conditions FAQ
  const bestSwell = spot.value.best_swell_direction
  const bestWind = spot.value.best_wind_direction
  if (bestSwell || bestWind) {
    const swellStr = Array.isArray(bestSwell) ? bestSwell.join(', ') : bestSwell
    const windStr = Array.isArray(bestWind) ? bestWind.join(', ') : bestWind
    let answer = `${name} works best with `
    if (swellStr) answer += `swells from the ${swellStr}`
    if (swellStr && windStr) answer += ' and '
    if (windStr) answer += `${windStr} winds (offshore)`
    answer += '.'
    
    faqs.push({
      '@type': 'Question',
      name: `What are the best conditions for surfing ${name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer
      }
    })
  }
  
  // How to read forecast FAQ
  faqs.push({
    '@type': 'Question',
    name: `How do I read the surf forecast for ${name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Our forecast shows wave height in feet, swell period in seconds (longer = more powerful), swell direction, wind speed/direction, and tide times. Look for longer periods (10+ seconds) and offshore winds for the best conditions.'
    }
  })
  
  if (faqs.length === 0) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs
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
    },
    {
      type: 'application/ld+json',
      innerHTML: computed(() => faqJsonLd.value ? JSON.stringify(faqJsonLd.value) : '')
    }
  ]
})
</script>
