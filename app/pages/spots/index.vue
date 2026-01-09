<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div class="mb-6 sm:mb-8">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-2">Surf Spots</h1>
        <p class="text-gray-600">Real-time forecasts powered by Howzit</p>
      </div>

      <div v-if="loading" class="text-gray-500">Loading spots...</div>
      
      <div v-else>
        <!-- State Sections -->
        <div v-for="state in states" :key="state" class="mb-8 sm:mb-12">
          <NuxtLink :to="`/spots/state/${state.toLowerCase().replace(/\s+/g, '-')}`" class="text-xl sm:text-3xl font-black uppercase mb-4 pb-2 border-b-2 border-black block hover:text-gray-600 transition-colors">{{ state }}</NuxtLink>
          
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NuxtLink 
              v-for="spot in spotsByState[state]" 
              :key="spot.id"
              :to="`/spots/${spot.slug}`"
              class="relative bg-white border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] p-4 sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
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
                  <p class="text-xl sm:text-2xl font-black">{{ formatWaveHeight(spot.forecast.wave_height) }}</p>
                  <p class="text-xs text-gray-500">{{ getSpotLabel(spot) }}</p>
                </div>
                <div v-else class="text-right text-gray-400">
                  <p class="text-lg">--</p>
                </div>
              </div>
              
              <div v-if="spot.forecast" class="flex gap-4 text-sm text-gray-600 font-mono pl-2">
                <span>{{ Math.round(spot.forecast.wave_period || 0) }}s</span>
                <span>{{ formatWind(spot.forecast.wind_speed) }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div v-if="spots.length === 0" class="text-center py-12 text-gray-500">
          <p>No spots found.</p>
        </div>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { calculateRating, scoreToColor, scoreToLabel } = useHowzitRating()

const spots = ref([])
const loading = ref(true)

const getSpotScore = (spot) => {
  if (!spot.forecast) return 0
  
  const f = spot.forecast
  
  return calculateRating({
    // Combined values (meters - algorithm converts internally)
    waveHeight: f.wave_height,
    wavePeriod: f.wave_period,
    waveDirection: f.wave_direction,
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
    beachOrientation: spot.orientation || 90
  })
}

const getSpotColor = (spot) => {
  return scoreToColor(getSpotScore(spot))
}

const getSpotLabel = (spot) => {
  return scoreToLabel(getSpotScore(spot))
}

onMounted(async () => {
  const { data: spotsData } = await supabase
    .from('spots')
    .select('*')
    .order('name')

  if (spotsData) {
    const spotsWithForecasts = await Promise.all(
      spotsData.map(async (spot) => {
        const { data: forecast } = await supabase
          .from('forecasts')
          .select('*')
          .eq('spot_id', spot.id)
          .gte('timestamp', new Date().toISOString())
          .order('timestamp', { ascending: true })
          .limit(1)
          .single()
        
        return { ...spot, forecast }
      })
    )
    spots.value = spotsWithForecasts
  }
  loading.value = false
})

const states = computed(() => {
  const stateOrder = ['New Jersey', 'New York', 'North Carolina']
  const spotStates = [...new Set(spots.value.map(s => s.state).filter(Boolean))]
  
  return spotStates.sort((a, b) => {
    const aIndex = stateOrder.indexOf(a)
    const bIndex = stateOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })
})

const spotsByState = computed(() => {
  const grouped = {}
  spots.value.forEach(spot => {
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

const siteUrl = 'https://www.hwztsurf.com'

useHead({ 
  title: 'Surf Spots - Howzit',
  meta: [
    { name: 'description', content: 'Live surf reports and forecasts for East Coast spots. Check wave heights, wind, tides, and conditions for New Jersey, New York, North Carolina, and Florida beaches.' },
    { property: 'og:title', content: 'Surf Spots - Howzit' },
    { property: 'og:description', content: 'Live surf reports and forecasts for East Coast spots. Check wave heights, wind, tides, and conditions.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/spots` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/spots` }
  ]
})
</script>
