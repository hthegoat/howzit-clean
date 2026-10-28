<template>
  <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
    <div class="px-4 py-3 border-b-2 border-black bg-gray-50 flex items-center justify-between">
      <h2 class="font-bold uppercase text-sm text-gray-600">Swell Radar</h2>
      <span class="text-xs text-gray-400 font-mono">{{ lastUpdated }}</span>
    </div>
    
    <div class="p-4">
      <div v-if="loading" class="text-center py-8 text-gray-400">
        Loading swell data...
      </div>
      
      <div v-else-if="!swellData" class="text-center py-8 text-gray-400">
        No swell data available
      </div>
      
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- Primary Swell -->
        <div class="text-center">
          <div class="text-xs uppercase text-gray-500 mb-1">Primary Swell</div>
          <div class="text-2xl font-black">{{ formatHeight(swellData.primaryHeight) }}</div>
          <div class="flex items-center justify-center gap-1 text-sm text-gray-600">
            <span class="font-mono">{{ swellData.primaryPeriod }}s</span>
            <span>@</span>
            <span class="font-mono">{{ formatDirection(swellData.primaryDirection) }}</span>
          </div>
        </div>
        
        <!-- Secondary Swell -->
        <div class="text-center">
          <div class="text-xs uppercase text-gray-500 mb-1">Secondary</div>
          <div class="text-2xl font-black" :class="swellData.secondaryHeight ? '' : 'text-gray-300'">
            {{ swellData.secondaryHeight ? formatHeight(swellData.secondaryHeight) : '--' }}
          </div>
          <div v-if="swellData.secondaryHeight" class="flex items-center justify-center gap-1 text-sm text-gray-600">
            <span class="font-mono">{{ swellData.secondaryPeriod }}s</span>
            <span>@</span>
            <span class="font-mono">{{ formatDirection(swellData.secondaryDirection) }}</span>
          </div>
          <div v-else class="text-sm text-gray-400">None</div>
        </div>
        
        <!-- Wind -->
        <div class="text-center">
          <div class="text-xs uppercase text-gray-500 mb-1">Wind</div>
          <div class="text-2xl font-black">{{ formatWind(swellData.windSpeed) }}</div>
          <div class="flex items-center justify-center gap-1 text-sm text-gray-600">
            <svg 
              :style="{ transform: `rotate(${(swellData.windDirection || 0) + 180}deg)` }" 
              class="w-4 h-4"
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2L8 10h3v12h2V10h3L12 2z"/>
            </svg>
            <span class="font-mono">{{ formatDirection(swellData.windDirection) }}</span>
          </div>
        </div>
        
        <!-- Conditions Summary -->
        <div class="text-center">
          <div class="text-xs uppercase text-gray-500 mb-1">Conditions</div>
          <div 
            class="text-lg font-black px-3 py-1 rounded inline-block"
            :style="{ backgroundColor: conditionColor, color: conditionTextColor }"
          >
            {{ conditionLabel }}
          </div>
          <div class="text-sm text-gray-500 mt-1">{{ spotCount }} spots</div>
        </div>
      </div>
      
      <!-- Swell Direction Visualization -->
      <div v-if="swellData" class="mt-4 flex items-center justify-center">
        <div class="relative w-32 h-32">
          <!-- Compass rose -->
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <!-- Outer circle -->
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="2"/>
            
            <!-- Cardinal directions -->
            <text x="50" y="12" text-anchor="middle" class="text-[10px] fill-gray-400 font-bold">N</text>
            <text x="90" y="53" text-anchor="middle" class="text-[10px] fill-gray-400 font-bold">E</text>
            <text x="50" y="95" text-anchor="middle" class="text-[10px] fill-gray-400 font-bold">S</text>
            <text x="10" y="53" text-anchor="middle" class="text-[10px] fill-gray-400 font-bold">W</text>
            
            <!-- Primary swell arrow -->
            <g :transform="`rotate(${swellData.primaryDirection || 0}, 50, 50)`">
              <line x1="50" y1="50" x2="50" y2="15" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
              <polygon points="50,8 44,20 56,20" fill="#3b82f6"/>
            </g>
            
            <!-- Secondary swell arrow (if exists) -->
            <g v-if="swellData.secondaryHeight" :transform="`rotate(${swellData.secondaryDirection || 0}, 50, 50)`">
              <line x1="50" y1="50" x2="50" y2="25" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-dasharray="4,2"/>
              <polygon points="50,20 46,28 54,28" fill="#10b981"/>
            </g>
            
            <!-- Center dot -->
            <circle cx="50" cy="50" r="4" fill="#1f2937"/>
          </svg>
          
          <!-- Legend -->
          <div class="absolute -bottom-6 left-0 right-0 flex justify-center gap-4 text-[10px]">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
              Primary
            </span>
            <span v-if="swellData.secondaryHeight" class="flex items-center gap-1">
              <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Secondary
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  state: {
    type: String,
    required: true
  }
})

const supabase = useSupabaseClient()

const loading = ref(true)
const swellData = ref(null)
const spotCount = ref(0)

// State to full name mapping
const stateNames = {
  'maine': 'Maine',
  'new-hampshire': 'New Hampshire',
  'massachusetts': 'Massachusetts',
  'rhode-island': 'Rhode Island',
  'connecticut': 'Connecticut',
  'new-york': 'New York',
  'new-jersey': 'New Jersey',
  'delaware': 'Delaware',
  'maryland': 'Maryland',
  'virginia': 'Virginia',
  'north-carolina': 'North Carolina',
  'south-carolina': 'South Carolina',
  'georgia': 'Georgia',
  'florida': 'Florida'
}

const lastUpdated = computed(() => {
  const now = new Date()
  return `Updated ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
})

const conditionLabel = computed(() => {
  if (!swellData.value) return '--'
  const h = swellData.value.primaryHeight || 0
  const p = swellData.value.primaryPeriod || 0
  const w = swellData.value.windSpeed || 0
  
  // Simple conditions logic
  if (h > 1.5 && p > 10 && w < 20) return 'Firing'
  if (h > 1 && p > 8 && w < 25) return 'Good'
  if (h > 0.5 && p > 6) return 'Fair'
  if (h > 0.3) return 'Poor'
  return 'Flat'
})

const conditionColor = computed(() => {
  const label = conditionLabel.value
  switch (label) {
    case 'Firing': return '#16a34a'
    case 'Good': return '#22c55e'
    case 'Fair': return '#eab308'
    case 'Poor': return '#f97316'
    case 'Flat': return '#9ca3af'
    default: return '#e5e7eb'
  }
})

const conditionTextColor = computed(() => {
  const label = conditionLabel.value
  return ['Firing', 'Good'].includes(label) ? '#fff' : '#000'
})

const formatHeight = (meters) => {
  if (!meters) return '--'
  const feet = meters * 3.281
  return `${Math.round(feet)}ft`
}

const formatWind = (kmh) => {
  if (!kmh) return '--'
  return `${Math.round(kmh * 0.621)}mph`
}

const formatDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return '--'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}

onMounted(async () => {
  try {
    const stateName = stateNames[props.state] || props.state
    
    // Get spots for this state
    const { data: spots, error: spotsError } = await supabase
      .from('spots')
      .select('id')
      .eq('state', stateName)
    
    if (spotsError) {
      console.error('Error fetching spots:', spotsError)
      loading.value = false
      return
    }
    
    if (!spots?.length) {
      loading.value = false
      return
    }
    
    spotCount.value = spots.length
    const spotIds = spots.map(s => s.id)
    
    // Get current forecasts for these spots
    const { data: forecasts, error: forecastsError } = await supabase
      .from('forecasts')
      .select('*')
      .in('spot_id', spotIds)
      .gte('timestamp', new Date().toISOString())
      .order('timestamp', { ascending: true })
      .limit(spotIds.length)
    
    if (forecastsError) {
      console.error('Error fetching forecasts:', forecastsError)
      loading.value = false
      return
    }
    
    if (forecasts?.length) {
      // Average the data across spots
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
      
      const heights = forecasts.map(f => f.swell_wave_height || f.wave_height).filter(Boolean)
      const periods = forecasts.map(f => f.swell_wave_period || f.wave_period).filter(Boolean)
      const directions = forecasts.map(f => f.swell_wave_direction || f.wave_direction).filter(Boolean)
      const windSpeeds = forecasts.map(f => f.wind_speed).filter(Boolean)
      const windDirs = forecasts.map(f => f.wind_direction).filter(Boolean)
      const secHeights = forecasts.map(f => f.secondary_swell_height).filter(Boolean)
      const secPeriods = forecasts.map(f => f.secondary_swell_period).filter(Boolean)
      const secDirs = forecasts.map(f => f.secondary_swell_direction).filter(Boolean)
      
      swellData.value = {
        primaryHeight: avg(heights),
        primaryPeriod: periods.length ? Math.round(avg(periods)) : null,
        primaryDirection: directions.length ? Math.round(avg(directions)) : null,
        secondaryHeight: avg(secHeights),
        secondaryPeriod: secPeriods.length ? Math.round(avg(secPeriods)) : null,
        secondaryDirection: secDirs.length ? Math.round(avg(secDirs)) : null,
        windSpeed: avg(windSpeeds),
        windDirection: windDirs.length ? Math.round(avg(windDirs)) : null
      }
    }
  } catch (err) {
    console.error('SwellRadar error:', err)
  }
  
  loading.value = false
})
</script>
