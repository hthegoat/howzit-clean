<template>
  <BrutalCard class="p-4 sm:p-6" :accent-color="accentColor">
    <!-- Header -->
    <div class="flex justify-between items-start gap-3 mb-4">
      <div class="min-w-0 flex-1">
        <p class="text-meta mb-1">{{ region }} • Buoy: {{ buoyId }}</p>
        <h1 class="text-xl sm:text-2xl lg:text-4xl font-black uppercase break-words">{{ spotName }}</h1>
      </div>
      <BrutalBadge :variant="ratingVariant">{{ ratingLabel }}</BrutalBadge>
    </div>
    
    <!-- Conditions Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      <div class="min-w-0">
        <p class="text-section mb-1">Wave Height</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.height }}</p>
        <p class="text-meta">ft</p>
      </div>
      <div class="min-w-0">
        <p class="text-section mb-1">Period</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.period }}</p>
        <p class="text-meta">seconds</p>
      </div>
      <div class="min-w-0">
        <p class="text-section mb-1">Wind</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.wind.speed }}</p>
        <p class="text-meta">mph {{ current.wind.direction }}</p>
      </div>
      <div class="min-w-0">
        <p class="text-section mb-1">Water Temp</p>
        <p class="text-xl sm:text-2xl font-black font-mono">{{ current.temp }}°</p>
        <p class="text-meta">fahrenheit</p>
      </div>
    </div>
    
    <p class="text-meta mt-4 pt-3 border-t border-gray-200">Last updated: {{ formattedTimestamp }}</p>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spotName: { type: String, required: true },
  region: { type: String, default: '' },
  buoyId: { type: String, default: '' },
  current: { type: Object, required: true },
  rating: { type: Number, default: 0 },
  ratingLabel: { type: String, default: 'Unknown' },
  timestamp: { type: String, default: null }
})

const ratingVariant = computed(() => {
  if (props.rating >= 4) return 'epic'
  if (props.rating >= 3) return 'good'
  if (props.rating >= 2) return 'fair'
  if (props.rating >= 1) return 'poor'
  return 'flat'
})

const accentColor = computed(() => {
  if (props.rating >= 4) return '#22c55e'
  if (props.rating >= 3) return '#a3e635'
  if (props.rating >= 2) return '#facc15'
  if (props.rating >= 1) return '#fb923c'
  return '#f87171'
})

const formattedTimestamp = computed(() => {
  if (!props.timestamp) return '--'
  return new Date(props.timestamp).toLocaleString()
})
</script>
