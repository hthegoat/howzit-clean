<template>
  <BrutalCard v-if="windChanges.length" class="p-4 sm:p-6">
    <p class="text-card-title mb-3">Wind Forecast</p>
    <div class="flex flex-wrap gap-2">
      <div 
        v-for="(change, idx) in windChanges" 
        :key="idx"
        class="flex items-center gap-1.5 px-2 py-1 rounded-full text-sm border-2 border-black"
        :class="change.colorClass"
      >
        <span class="font-bold">{{ change.label }}</span>
        <span class="text-gray-600">{{ change.timeRange }}</span>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hourlyData: { type: Array, default: () => [] },
  beachOrientation: { type: Number, default: 90 }
})

const getWindQuality = (windDir) => {
  if (windDir === null || windDir === undefined) return 'unknown'
  
  const offshoreDirection = (props.beachOrientation + 180) % 360
  let diff = Math.abs(windDir - offshoreDirection)
  if (diff > 180) diff = 360 - diff
  
  if (diff <= 30) return 'offshore'
  if (diff <= 60) return 'cross-off'
  if (diff <= 90) return 'cross'
  if (diff <= 120) return 'cross-on'
  return 'onshore'
}

const windChanges = computed(() => {
  if (!props.hourlyData?.length) return []
  
  const changes = []
  let currentQuality = null
  let startHour = null
  
  const formatHour = (hour) => {
    const h = hour % 12 || 12
    const ampm = hour < 12 ? 'a' : 'p'
    return `${h}${ampm}`
  }
  
  const labels = {
    'offshore': 'Offshore',
    'cross-off': 'Cross-off',
    'cross': 'Cross',
    'cross-on': 'Cross-on',
    'onshore': 'Onshore',
    'unknown': 'Variable'
  }
  
  const colors = {
    'offshore': 'bg-green-100',
    'cross-off': 'bg-green-50',
    'cross': 'bg-yellow-100',
    'cross-on': 'bg-orange-100',
    'onshore': 'bg-red-100',
    'unknown': 'bg-gray-100'
  }
  
  props.hourlyData.forEach((h, i) => {
    const quality = getWindQuality(h.windDirection)
    
    if (quality !== currentQuality) {
      // End previous period
      if (currentQuality !== null && startHour !== null) {
        changes.push({
          quality: currentQuality,
          label: labels[currentQuality],
          timeRange: `${formatHour(startHour)}-${formatHour(h.hour)}`,
          colorClass: colors[currentQuality]
        })
      }
      // Start new period
      currentQuality = quality
      startHour = h.hour
    }
    
    // Handle last hour
    if (i === props.hourlyData.length - 1 && currentQuality !== null) {
      changes.push({
        quality: currentQuality,
        label: labels[currentQuality],
        timeRange: `${formatHour(startHour)}-${formatHour(h.hour + 1)}`,
        colorClass: colors[currentQuality]
      })
    }
  })
  
  return changes
})
</script>
