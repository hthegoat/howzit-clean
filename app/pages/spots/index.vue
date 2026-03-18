<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div class="mb-6 sm:mb-8">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-2">Surf Spots</h1>
        <p class="text-gray-600">Real-time forecasts powered by Howzit</p>
      </div>

      <!-- Controls Card -->
      <BrutalCard class="p-4 mb-6">
        <!-- View Toggle Row -->
        <div class="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-200">
          <span class="text-section">View</span>
          <div class="flex gap-2">
            <button 
              @click="viewMode = 'list'" 
              class="px-4 py-2 text-sm font-bold uppercase border-2 border-black rounded-[var(--radius)] transition-all"
              :class="viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
            >
              ☰ List
            </button>
            <button 
              @click="viewMode = 'map'" 
              class="px-4 py-2 text-sm font-bold uppercase border-2 border-black rounded-[var(--radius)] transition-all"
              :class="viewMode === 'map' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
            >
              ⌖ Map
            </button>
          </div>
          
          <!-- Sort (only show for list view) -->
          <template v-if="viewMode === 'list'">
            <span class="text-section ml-auto hidden sm:inline">Sort</span>
            <div class="flex gap-2">
              <button
                @click="sortMode = 'rating'"
                class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black rounded-[var(--radius)] transition-all"
                :class="sortMode === 'rating' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
              >
                Best Waves
              </button>
              <button
                @click="sortMode = 'alpha'"
                class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black rounded-[var(--radius)] transition-all"
                :class="sortMode === 'alpha' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
              >
                A–Z
              </button>
              <button
                @click="sortMode = 'state'"
                class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black rounded-[var(--radius)] transition-all"
                :class="sortMode === 'state' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
              >
                By State
              </button>
            </div>
          </template>
        </div>

        <!-- State Filter Row -->
        <div class="flex items-center gap-3">
          <span class="text-section shrink-0">State</span>
          <div class="relative min-w-0 flex-1">
            <div class="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth" ref="stateScrollRef">
              <button
                @click="selectedRegion = null"
                class="px-3 py-1.5 text-xs font-bold uppercase border-2 rounded-[var(--radius)] transition-all shrink-0"
                :class="selectedRegion === null 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black'"
              >
                All
              </button>
              <button
                v-for="sf in stateFilters"
                :key="sf.key"
                @click="selectedRegion = sf.key"
                class="px-3 py-1.5 text-xs font-bold uppercase border-2 rounded-[var(--radius)] transition-all shrink-0"
                :class="selectedRegion === sf.key 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black'"
              >
                {{ sf.label }} <span class="text-meta">{{ sf.count }}</span>
              </button>
            </div>
            <!-- Fade hint right -->
            <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" v-if="showScrollHint"></div>
          </div>
        </div>
      </BrutalCard>

      <div v-if="loading" class="text-gray-500">Loading spots...</div>
      
      <div v-else>
        <!-- Map View -->
        <div v-if="viewMode === 'map'" class="mb-8">
          <SpotMap 
            :spots="filteredSpots" 
            :get-spot-color="getSpotColor" 
            :get-spot-label="getSpotLabel"
            :selected-region="selectedRegion"
            height="tall" 
          />
        </div>

        <!-- List View -->
        <div v-if="viewMode === 'list'">
          <!-- Sorted by Rating or A-Z (flat list) -->
          <div v-if="sortMode !== 'state'">
            <p class="text-meta mb-4">{{ filteredSpots.length }} spots</p>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <NuxtLink 
                v-for="spot in sortedSpots" 
                :key="spot.id"
                :to="`/spots/${spot.slug}`"
                class="relative bg-white border-2 border-black rounded-[var(--radius)] sm:shadow-[var(--shadow-md)] p-4 sm:hover:shadow-[var(--shadow-sm)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
              >
                <!-- Rating color bar -->
                <div 
                  :style="{ backgroundColor: getSpotColor(spot) }"
                  class="absolute left-0 top-0 bottom-0 w-1.5"
                ></div>
                
                <div class="flex justify-between items-start gap-2 mb-3 pl-2">
                  <div class="min-w-0">
                    <h3 class="font-bold text-lg truncate">{{ spot.name }}</h3>
                    <p class="text-sm text-gray-500">{{ spot.region }} <span class="text-gray-400">· {{ spot.state }}</span></p>
                  </div>
                  <div v-if="spot.forecast" class="text-right flex-shrink-0">
                    <p class="text-xl sm:text-2xl font-black">{{ formatWaveHeight(spot.forecast.blended_wave_height ?? spot.forecast.wave_height) }}</p>
                    <p class="text-xs text-gray-500">{{ getSpotLabel(spot) }}</p>
                  </div>
                  <div v-else class="text-right text-gray-400">
                    <p class="text-lg">--</p>
                  </div>
                </div>
                
                <div v-if="spot.forecast" class="flex gap-4 text-meta pl-2">
                  <span>{{ Math.round(spot.forecast.wave_period || 0) }}s</span>
                  <span>{{ formatWind(spot.forecast.wind_speed) }}</span>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Grouped by State -->
          <template v-else>
            <div v-for="state in filteredStates" :key="state" class="mb-8 sm:mb-12">
              <NuxtLink 
                :to="`/spots/state/${state.toLowerCase().replace(/\s+/g, '-')}`" 
                class="text-xl sm:text-3xl font-black uppercase mb-4 pb-2 border-b-2 border-black block hover:text-gray-600 transition-colors"
              >
                {{ state }}
              </NuxtLink>
              
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <NuxtLink 
                  v-for="spot in filteredSpotsByState[state]" 
                  :key="spot.id"
                  :to="`/spots/${spot.slug}`"
                  class="relative bg-white border-2 border-black rounded-[var(--radius)] sm:shadow-[var(--shadow-md)] p-4 sm:hover:shadow-[var(--shadow-sm)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
                >
                  <!-- Rating color bar -->
                  <div 
                    :style="{ backgroundColor: getSpotColor(spot) }"
                    class="absolute left-0 top-0 bottom-0 w-1.5"
                  ></div>
                  
                  <div class="flex justify-between items-start gap-2 mb-3 pl-2">
                    <div class="min-w-0">
                      <h3 class="font-bold text-lg truncate">{{ spot.name }}</h3>
                      <p class="text-sm text-gray-500">{{ spot.region }}</p>
                    </div>
                    <div v-if="spot.forecast" class="text-right flex-shrink-0">
                      <p class="text-xl sm:text-2xl font-black">{{ formatWaveHeight(spot.forecast.blended_wave_height ?? spot.forecast.wave_height) }}</p>
                      <p class="text-xs text-gray-500">{{ getSpotLabel(spot) }}</p>
                    </div>
                    <div v-else class="text-right text-gray-400">
                      <p class="text-lg">--</p>
                    </div>
                  </div>
                  
                  <div v-if="spot.forecast" class="flex gap-4 text-meta pl-2">
                    <span>{{ Math.round(spot.forecast.wave_period || 0) }}s</span>
                    <span>{{ formatWind(spot.forecast.wind_speed) }}</span>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </template>

          <div v-if="filteredSpots.length === 0" class="text-center py-12 text-gray-500">
            <p>No spots found.</p>
          </div>
        </div>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { calculateRating, scoreToColor, scoreToLabel } = useHowzitRating()

const loading = ref(false)
const viewMode = ref('list')
const selectedRegion = ref(null)
const sortMode = ref('state') // 'rating' | 'alpha' | 'state'
const stateScrollRef = ref(null)
const showScrollHint = ref(true)

// Track scroll position to hide/show fade hint
const onStateScroll = () => {
  if (!stateScrollRef.value) return
  const el = stateScrollRef.value
  showScrollHint.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 8
}

onMounted(() => {
  if (stateScrollRef.value) {
    stateScrollRef.value.addEventListener('scroll', onStateScroll, { passive: true })
    // Check initial state
    nextTick(() => onStateScroll())
  }
})

// State abbreviation map
const stateAbbr = {
  'California': 'CA', 'Hawaii': 'HI', 'Florida': 'FL', 'New Jersey': 'NJ',
  'Oregon': 'OR', 'North Carolina': 'NC', 'New York': 'NY', 'South Carolina': 'SC',
  'Massachusetts': 'MA', 'Delaware': 'DE', 'Rhode Island': 'RI', 'Georgia': 'GA',
  'Virginia': 'VA', 'Connecticut': 'CT', 'New Hampshire': 'NH', 'Maryland': 'MD', 'Maine': 'ME'
}

// === SSR: Fetch spots + nearest forecasts server-side ===
// Only fetch forecasts within the next 3 hours instead of all 14 days
// This reduces ~46K rows to ~400 (137 spots × 3 hours)
const { data: ssrSpots } = await useAsyncData('spots-index', async () => {
  const now = new Date()
  const threeHoursOut = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  
  const [spotsResult, forecastsResult] = await Promise.all([
    supabase.from('spots').select('*').order('name'),
    supabase
      .from('forecasts')
      .select('*')
      .gte('timestamp', now.toISOString())
      .lte('timestamp', threeHoursOut.toISOString())
      .order('timestamp', { ascending: true })
  ])

  if (!spotsResult.data) return []

  // Group forecasts by spot_id and take the first (nearest) one
  const forecastsBySpot = {}
  forecastsResult.data?.forEach(f => {
    if (!forecastsBySpot[f.spot_id]) {
      forecastsBySpot[f.spot_id] = f
    }
  })
  
  return spotsResult.data.map(spot => ({
    ...spot,
    forecast: forecastsBySpot[spot.id] || null
  }))
})

const spots = ref(ssrSpots.value || [])

// Compute states with counts, ordered by count descending
const stateFilters = computed(() => {
  const counts = {}
  spots.value.forEach(s => {
    if (s.state) counts[s.state] = (counts[s.state] || 0) + 1
  })
  return Object.entries(counts)
    .map(([state, count]) => ({ key: state, label: stateAbbr[state] || state, count }))
    .sort((a, b) => b.count - a.count)
})

// Filter spots by selected state
const filteredSpots = computed(() => {
  if (!selectedRegion.value) return spots.value
  return spots.value.filter(s => s.state === selectedRegion.value)
})

const getSpotScore = (spot) => {
  if (!spot.forecast) return 0
  
  const f = spot.forecast
  
  return calculateRating({
    // Use blended values when available, fallback to Open-Meteo
    waveHeight: f.blended_wave_height ?? f.wave_height,
    wavePeriod: f.blended_wave_period ?? f.wave_period,
    waveDirection: f.blended_wave_direction ?? f.wave_direction,
    // Swell components
    swellWaveHeight: f.swell_wave_height,
    swellWavePeriod: f.swell_wave_period,
    swellWaveDirection: f.swell_wave_direction,
    // Wind wave (chop)
    windWaveHeight: f.wind_wave_height,
    windWavePeriod: f.wind_wave_period,
    windWaveDirection: f.wind_wave_direction,
    // Secondary swell
    secondarySwellHeight: f.secondary_swell_height,
    secondarySwellPeriod: f.secondary_swell_period,
    secondarySwellDirection: f.secondary_swell_direction,
    // Wind
    windSpeed: f.wind_speed,
    windDirection: f.wind_direction,
    windGust: f.wind_gust,
    // Spot config
    beachOrientation: spot.orientation || 90,
    surfRegion: spot.surf_region || 'mid_atlantic'
  })
}

const getSpotColor = (spot) => {
  return scoreToColor(getSpotScore(spot))
}

const getSpotLabel = (spot) => {
  return scoreToLabel(getSpotScore(spot))
}

// Sorted spots for flat list views (rating or alpha)
const sortedSpots = computed(() => {
  const spotsWithScores = filteredSpots.value.map(spot => ({
    ...spot,
    _score: getSpotScore(spot)
  }))
  
  if (sortMode.value === 'rating') {
    return spotsWithScores.sort((a, b) => b._score - a._score)
  } else if (sortMode.value === 'alpha') {
    return spotsWithScores.sort((a, b) => a.name.localeCompare(b.name))
  }
  
  return spotsWithScores
})

// States ordered by spot count (largest first)
const filteredStates = computed(() => {
  const counts = {}
  filteredSpots.value.forEach(s => {
    if (s.state) counts[s.state] = (counts[s.state] || 0) + 1
  })
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])
})

const filteredSpotsByState = computed(() => {
  const grouped = {}
  filteredSpots.value.forEach(spot => {
    const state = spot.state || 'Other'
    if (!grouped[state]) grouped[state] = []
    grouped[state].push(spot)
  })
  Object.keys(grouped).forEach(state => {
    grouped[state].sort((a, b) => a.name.localeCompare(b.name))
  })
  return grouped
})

const formatWaveHeight = (heightMeters) => {
  if (!heightMeters) return '--'
  const feet = heightMeters * 3.281
  const min = Math.max(1, Math.round(feet) - 1)
  const max = Math.round(feet) + 1
  if (min === max) return `${min}ft`
  return `${min}-${max}ft`
}

const formatWind = (kmh) => {
  if (!kmh) return '--'
  return `${Math.round(kmh * 0.621)}mph`
}

const siteUrl = 'https://hwztsurf.com'

const spotCount = computed(() => spots.value?.length || 137)
const stateCount = computed(() => new Set(spots.value?.map(s => s.state).filter(Boolean)).size || 17)

useHead({ 
  title: computed(() => `Surf Reports & Forecasts - ${spotCount.value} Spots Across ${stateCount.value} States | Howzit`),
  meta: [
    { name: 'description', content: computed(() => `Free surf reports and forecasts for ${spotCount.value} spots across ${stateCount.value} states. Real-time wave heights, wind, tides, and conditions from Maine to Hawaii.`) },
    { property: 'og:title', content: computed(() => `Surf Reports & Forecasts - ${spotCount.value} Spots | Howzit`) },
    { property: 'og:description', content: computed(() => `Free surf reports and forecasts for ${spotCount.value} spots across ${stateCount.value} states. No paywall, no ads.`) },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/spots` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/spots` }
  ]
})
</script>
