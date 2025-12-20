<template>
  <div 
    class="w-6 h-6 rounded flex items-center justify-center"
    :style="{ backgroundColor: windColor }"
  >
    <svg 
      class="w-3 h-3 text-white" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      :style="{ transform: `rotate(${degrees}deg)` }"
    >
      <path d="M12 2L6 12h4v10h4V12h4L12 2z" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  degrees: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
  beachOrientation: { type: Number, default: 90 }
})

const windColor = computed(() => {
  if (props.degrees === null || props.degrees === undefined) return '#9ca3af'
  
  const beachDir = props.beachOrientation
  let diff = Math.abs(props.degrees - beachDir)
  if (diff > 180) diff = 360 - diff
  
  if (diff >= 150) return '#22c55e'    // offshore - green
  if (diff >= 120) return '#4ade80'    // cross-off - light green
  if (diff >= 60) return '#facc15'     // cross - yellow
  if (diff >= 30) return '#fb923c'     // cross-on - orange
  return '#ef4444'                      // onshore - red
})
</script>
