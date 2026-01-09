<template>
  <BrutalCard class="p-4 sm:p-6" :accent-color="accentColor">
    <!-- Header -->
    <div class="flex justify-between items-start gap-3 mb-4">
      <div class="min-w-0 flex-1">
        <p class="text-meta mb-1">
          <NuxtLink :to="stateUrl" class="hover:underline">{{ state }}</NuxtLink>
          <span v-if="region"> • {{ region }}</span>
          <span v-if="buoyId"> • <a :href="`https://www.ndbc.noaa.gov/station_page.php?station=${buoyId}`" target="_blank" rel="noopener" class="hover:underline">Buoy: {{ buoyId }}</a></span>
        </p>
        <h1 class="text-xl sm:text-2xl lg:text-4xl font-black uppercase break-words">{{ spotName }}</h1>
      </div>
      <BrutalBadge :variant="ratingVariant">{{ ratingLabel }}</BrutalBadge>
    </div>
    
    <!-- Conditions Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
      <div class="min-w-0">
        <p class="text-section mb-1">Wave Height</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.height }}</p>
        <p class="text-meta">ft</p>
      </div>
      <div class="min-w-0">
        <p class="text-section mb-1">Swell</p>
        <div class="flex items-center gap-1">
          <p class="text-lg sm:text-xl font-bold font-mono text-gray-500">~{{ current.period }}s</p>
          <svg 
            v-if="current.swellDirection !== null"
            class="w-4 h-4 text-gray-400" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            :style="{ transform: `rotate(${current.swellDirection + 180}deg)` }"
          >
            <path d="M12 2L6 12h4v10h4V12h4L12 2z" />
          </svg>
        </div>
        <p class="text-meta">{{ formatDirection(current.swellDirection) }}</p>
      </div>
      <div class="min-w-0">
        <p class="text-section mb-1">Wind</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.wind.speed }}<span class="text-sm">mph</span></p>
        <p class="text-meta" :class="windQualityColor">{{ windQualityLabel }} ({{ current.wind.direction }})</p>
      </div>
      <div class="min-w-0">
        <p class="text-section mb-1">Water</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.temp }}°</p>
        <p class="text-meta">{{ wetsuit }}</p>
      </div>
    </div>

    <!-- Tide + Sun Row -->
    <div class="flex items-center gap-3 text-sm border-t border-gray-200 pt-3">
      <div v-if="tideState" class="flex items-center gap-1.5">
        <svg class="w-4 h-4" :class="tideState.rising ? 'text-blue-500' : 'text-amber-500'" viewBox="0 0 24 24" fill="currentColor">
          <path v-if="tideState.rising" d="M12 4l-8 8h5v8h6v-8h5z" />
          <path v-else d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
        <span class="font-medium">{{ tideState.rising ? 'Rising' : 'Falling' }}</span>
        <span class="text-gray-500">• {{ tideState.nextType }} in {{ tideState.timeUntil }}</span>
      </div>
      <div v-if="sunrise && sunset" class="flex items-center gap-1.5 text-gray-500 text-xs">
        <span>☀️ {{ sunrise }}</span>
        <span>→</span>
        <span>🌙 {{ sunset }}</span>
      </div>
    </div>
    
    <!-- Footer: Data source + Feedback -->
    <div class="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-gray-200">
      <p class="text-meta">Updated: {{ formattedTimestamp }} • Data: <a href="https://open-meteo.com/" target="_blank" rel="noopener" class="underline hover:text-gray-700">Open-Meteo</a></p>
      <div class="flex items-center gap-1 text-gray-400">
        <span class="text-xs">Accurate?</span>
        <button 
          @click="$emit('feedback', true)" 
          class="hover:text-green-600 transition-colors p-0.5"
          title="Yes"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button 
          @click="$emit('feedback', false)" 
          class="hover:text-red-500 transition-colors p-0.5"
          title="No"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const emit = defineEmits(['feedback'])

const props = defineProps({
  spotName: { type: String, required: true },
  state: { type: String, default: '' },
  region: { type: String, default: '' },
  buoyId: { type: String, default: '' },
  current: { type: Object, required: true },
  rating: { type: Number, default: 0 },
  ratingLabel: { type: String, default: 'Unknown' },
  timestamp: { type: String, default: null },
  tideState: { type: Object, default: null },
  todayTides: { type: Array, default: () => [] },
  sunrise: { type: String, default: null },
  sunset: { type: String, default: null },
  beachOrientation: { type: Number, default: 90 },
  hourlyData: { type: Array, default: () => [] }
})

const stateUrl = computed(() => {
  if (!props.state) return '/spots'
  return `/spots/state/${props.state.toLowerCase().replace(/\s+/g, '-')}`
})

const ratingVariant = computed(() => {
  const label = props.ratingLabel?.toLowerCase() || ''
  if (label === 'epic') return 'epic'
  if (label === 'good') return 'good'
  if (label.includes('fair')) return 'fair'  // Fair or Fair+
  if (label.includes('poor')) return 'poor'  // Poor or Poor+
  return 'flat'
})

const accentColor = computed(() => {
  const label = props.ratingLabel?.toLowerCase() || ''
  if (label === 'epic' || label === 'good') return '#10b981'  // emerald-500
  if (label.includes('fair')) return '#3b82f6'  // blue-500
  if (label.includes('poor')) return '#fb7185'  // rose-400
  return '#d1d5db'  // gray-300
})

const formattedTimestamp = computed(() => {
  if (!props.timestamp) return '--'
  return new Date(props.timestamp).toLocaleString()
})

const formattedTides = computed(() => {
  if (!props.todayTides?.length) return []
  return props.todayTides.map(t => ({
    type: t.type,
    time: new Date(t.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }))
})

const formatDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return '--'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}

// Simplified wind quality - 3 categories: Offshore, Sideshore, Onshore
const getSimpleWindQuality = (windDir) => {
  if (windDir === null || windDir === undefined) return 'unknown'
  
  const offshoreDirection = (props.beachOrientation + 180) % 360
  let diff = Math.abs(windDir - offshoreDirection)
  if (diff > 180) diff = 360 - diff
  
  if (diff <= 60) return 'offshore'   // Offshore or cross-off
  if (diff <= 120) return 'sideshore' // Cross or cross-on
  return 'onshore'
}

// Wind quality based on beach orientation
const windQuality = computed(() => {
  return getSimpleWindQuality(props.current?.wind?.degrees)
})

const windQualityLabel = computed(() => {
  const labels = {
    'offshore': 'Offshore',
    'sideshore': 'Sideshore',
    'onshore': 'Onshore',
    'unknown': ''
  }
  return labels[windQuality.value]
})

const windQualityColor = computed(() => {
  const colors = {
    'offshore': 'text-green-600',
    'sideshore': 'text-yellow-600',
    'onshore': 'text-red-500',
    'unknown': 'text-gray-500'
  }
  return colors[windQuality.value]
})

// Wind summary from hourly data
const windSummary = computed(() => {
  if (!props.hourlyData?.length) return null
  
  // Group consecutive hours by wind quality
  const periods = []
  let currentQuality = null
  let startHour = null
  
  const formatHour = (hour) => {
    const h = hour % 12 || 12
    const ampm = hour < 12 ? 'am' : 'pm'
    return `${h}${ampm}`
  }
  
  props.hourlyData.forEach((h, i) => {
    const quality = getSimpleWindQuality(h.windDirection)
    
    if (quality !== currentQuality) {
      if (currentQuality !== null && startHour !== null) {
        periods.push({ quality: currentQuality, start: startHour, end: h.hour })
      }
      currentQuality = quality
      startHour = h.hour
    }
    
    if (i === props.hourlyData.length - 1 && currentQuality !== null) {
      periods.push({ quality: currentQuality, start: startHour, end: h.hour + 1 })
    }
  })
  
  if (periods.length === 0) return null
  if (periods.length === 1) {
    const p = periods[0]
    const label = p.quality === 'offshore' ? 'Offshore' : p.quality === 'sideshore' ? 'Sideshore' : 'Onshore'
    return `${label} all day`
  }
  
  // Build summary
  const labels = { 'offshore': 'offshore', 'sideshore': 'sideshore', 'onshore': 'onshore' }
  return periods.map(p => `${labels[p.quality]} ${formatHour(p.start)}-${formatHour(p.end)}`).join(', ')
})

// Wetsuit recommendation based on water temp
const wetsuit = computed(() => {
  const temp = props.current?.temp
  if (!temp || temp === '--') return ''
  if (temp >= 72) return 'Boardshorts'
  if (temp >= 68) return 'Springsuit'
  if (temp >= 62) return '3/2mm'
  if (temp >= 55) return '4/3mm'
  if (temp >= 50) return '5/4mm + boots'
  return '6/5mm + boots/hood'
})
</script>
