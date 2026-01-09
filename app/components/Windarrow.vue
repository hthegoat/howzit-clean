<template>
  <div 
    class="w-6 h-6 rounded flex items-center justify-center cursor-pointer relative group"
    :style="{ backgroundColor: windColor }"
  >
    <svg 
      class="w-3 h-3 text-white" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      :style="{ transform: `rotate(${arrowRotation}deg)` }"
    >
      <path d="M12 2L6 12h4v10h4V12h4L12 2z" />
    </svg>
    
    <!-- Tooltip -->
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
      <div class="font-bold">{{ windLabel }}</div>
      <div>{{ speed }}kts{{ gust ? ` (G${gust})` : '' }}</div>
      <div>{{ directionLabel }}</div>
      <!-- Arrow pointing down -->
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  degrees: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
  gust: { type: Number, default: null },
  beachOrientation: { type: Number, default: 90 }
})

// Arrow points in direction wind is blowing TO (add 180 to "from" direction)
const arrowRotation = computed(() => {
  if (props.degrees === null || props.degrees === undefined) return 0
  return (props.degrees + 180) % 360
})

const directionLabel = computed(() => {
  if (props.degrees === null || props.degrees === undefined) return '--'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(props.degrees / 22.5) % 16
  return `From ${dirs[idx]} (${props.degrees}°)`
})

const windLabel = computed(() => {
  if (props.degrees === null || props.degrees === undefined) return 'Unknown'
  
  const offshoreDirection = (props.beachOrientation + 180) % 360
  let diff = Math.abs(props.degrees - offshoreDirection)
  if (diff > 180) diff = 360 - diff
  
  if (diff <= 30) return 'Offshore'
  if (diff <= 60) return 'Cross-off'
  if (diff <= 90) return 'Cross-shore'
  if (diff <= 120) return 'Cross-on'
  return 'Onshore'
})

const windColor = computed(() => {
  if (props.degrees === null || props.degrees === undefined) return '#9ca3af'
  
  const offshoreDirection = (props.beachOrientation + 180) % 360
  let diff = Math.abs(props.degrees - offshoreDirection)
  if (diff > 180) diff = 360 - diff
  
  if (diff <= 30) return '#22c55e'    // offshore - green
  if (diff <= 60) return '#4ade80'    // cross-off - light green
  if (diff <= 90) return '#facc15'    // cross - yellow
  if (diff <= 120) return '#fb923c'   // cross-on - orange
  return '#ef4444'                     // onshore - red
})
</script>
