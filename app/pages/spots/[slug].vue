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
              :region="spot.region"
              :buoy-id="spot.buoy_id"
              :current="currentConditions"
              :rating="currentRating"
              :rating-label="ratingLabel"
              :timestamp="latestForecast?.fetched_at"
            />

            <TideCard :tides="surflineTides" />

            <ForecastTable 
              :forecast="displayForecast"
              :selected-day="selectedDay"
              @select="selectDay"
            />

            <HourlyDetail 
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
            <LiveReports :spot-id="spot.id" />
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
const { calculateRating, scoreToStars, scoreToLabel } = useHowzitRating()

// Refs
const spot = ref(null)
const surflineForecasts = ref([])
const surflineTides = ref([])
const buoyReading = ref(null)
const spotSummary = ref(null)
const selectedDay = ref(null)
const nearbySpots = ref([])

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

const currentConditions = computed(() => {
  const f = latestForecast.value
  if (!f) {
    return {
      height: '--',
      period: '--',
      wind: { speed: '--', direction: '--' },
      temp: '--'
    }
  }

  const windMph = f.wind_speed ? Math.round(f.wind_speed * 1.151) : '--'
  const windDir = f.wind_direction ? formatDirection(f.wind_direction) : '--'
  const waterTempC = buoyReading.value?.water_temp
  const waterTempF = waterTempC ? Math.round((waterTempC * 9/5) + 32) : '--'

  return {
    height: `${f.wave_min || 0}-${f.wave_max || 0}`,
    period: f.swell_period ? Math.round(f.swell_period) : '--',
    wind: { speed: windMph, direction: windDir },
    temp: waterTempF
  }
})

// Howzit Rating - calculated from actual conditions
const currentRating = computed(() => {
  const f = latestForecast.value
  if (!f) return 0
  
  const avgWaveHeight = ((f.wave_min || 0) + (f.wave_max || 0)) / 2
  const windMph = f.wind_speed ? f.wind_speed * 1.151 : 0
  
  const score = calculateRating({
    waveHeight: avgWaveHeight,
    wavePeriod: f.swell_period,
    windSpeed: windMph,
    windDirection: f.wind_direction,
    beachOrientation: beachOrientation.value
  })
  
  return scoreToStars(score)
})

const ratingLabel = computed(() => {
  const f = latestForecast.value
  if (!f) return 'Unknown'
  
  const avgWaveHeight = ((f.wave_min || 0) + (f.wave_max || 0)) / 2
  const windMph = f.wind_speed ? f.wind_speed * 1.151 : 0
  
  const score = calculateRating({
    waveHeight: avgWaveHeight,
    wavePeriod: f.swell_period,
    windSpeed: windMph,
    windDirection: f.wind_direction,
    beachOrientation: beachOrientation.value
  })
  
  return scoreToLabel(score)
})

const displayForecast = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  
  const byDay = {}
  surflineForecasts.value.forEach(f => {
    const date = new Date(f.timestamp).toDateString()
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(f)
  })

  const dailyData = Object.entries(byDay).map(([dateStr, readings]) => {
    const date = new Date(dateStr)
    const isToday = date.toDateString() === today.toDateString()
    
    const waveMin = Math.min(...readings.map(r => r.wave_min).filter(v => v !== null))
    const waveMax = Math.max(...readings.map(r => r.wave_max).filter(v => v !== null))
    const avgWaveHeight = (waveMin + waveMax) / 2
    
    const swellReading = readings.find(r => r.swell_period)
    const winds = readings.filter(r => r.wind_speed !== null)
    const avgWindSpeed = winds.length ? winds.reduce((sum, r) => sum + r.wind_speed, 0) / winds.length : 0
    const avgWindDir = winds.length ? winds.reduce((sum, r) => sum + (r.wind_direction || 0), 0) / winds.length : null
    
    // Calculate Howzit rating for this day
    const score = calculateRating({
      waveHeight: avgWaveHeight,
      wavePeriod: swellReading?.swell_period,
      windSpeed: avgWindSpeed * 1.151,
      windDirection: avgWindDir,
      beachOrientation: beachOrientation.value
    })

    return {
      date,
      dayName: isToday ? 'Today' : days[date.getDay()],
      waveDisplay: formatWaveRange(waveMin, waveMax),
      period: swellReading?.swell_period ? Math.round(swellReading.swell_period) : '--',
      windSpeed: avgWindSpeed ? Math.round(avgWindSpeed * 1.151) : '--',
      stars: scoreToStars(score),
      score // Pass raw score for more granular color
    }
  })

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
  const windMph = f.wind_speed ? f.wind_speed * 1.151 : 0
  if (windMph > 20) h.push('Strong winds - use caution')
  if (f.wave_max > 8) h.push('Large surf - experienced surfers only')
  return h
})

// Auto-select first day
watch(displayForecast, async (forecast) => {
  if (forecast?.length > 0 && !selectedDay.value) {
    await selectDay(forecast[0])
  }
}, { immediate: true })

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

    // Forecasts
    const now = new Date()
    const sixDaysOut = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
    const { data: forecastData } = await supabase
      .from('surfline_forecasts')
      .select('*')
      .eq('spot_id', spot.value.id)
      .gte('timestamp', now.toISOString())
      .lte('timestamp', sixDaysOut.toISOString())
      .order('timestamp', { ascending: true })
    surflineForecasts.value = forecastData || []

    // Tides - start from beginning of today to get all today's tides
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const twoDaysOut = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const { data: tideData } = await supabase
      .from('surfline_tides')
      .select('*')
      .eq('spot_id', spot.value.id)
      .gte('timestamp', startOfToday.toISOString())
      .lte('timestamp', twoDaysOut.toISOString())
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
  }
})

// SEO
useHead({
  title: computed(() => spot.value ? `${spot.value.name} Surf Report - Howzit` : 'Loading...')
})
</script>
