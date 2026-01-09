<template>
  <BrutalCard class="p-4 sm:p-6">
    <p class="text-card-title mb-3">Today's Tide</p>
    <div class="h-40 mb-4 overflow-hidden">
      <TideChart :tides="tides" />
    </div>
    
    <div v-if="todayTides.length" class="overflow-x-auto pb-2">
      <div class="flex gap-2 sm:grid sm:grid-cols-4 sm:gap-3">
        <div 
          v-for="(tide, index) in todayTides" 
          :key="index" 
          class="w-24 sm:w-auto flex-shrink-0 p-2 sm:p-3 rounded-lg border-2 border-black sm:shadow-[2px_2px_0px_#000]"
          :class="tide.type === 'HIGH' ? 'bg-blue-100' : 'bg-amber-50'"
        >
          <p class="text-xs font-bold uppercase" :class="tide.type === 'HIGH' ? 'text-blue-600' : 'text-amber-600'">
            {{ tide.type }}
          </p>
          <p class="text-sm sm:text-lg font-black font-mono">{{ formatTime(tide.timestamp) }}</p>
          <p class="text-meta">{{ tide.height.toFixed(1) }}ft</p>
        </div>
      </div>
    </div>
    <div v-else class="text-meta p-4 bg-gray-100 rounded-lg text-center">
      No tide data available
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tides: { type: Array, default: () => [] }
})

const todayTides = computed(() => {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  
  const filtered = props.tides
    .filter(t => {
      const tideDate = new Date(t.timestamp)
      return tideDate >= todayStart && tideDate < todayEnd
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  // Deduplicate: if two tides of same type are within 30 min, keep first one
  const result = []
  for (const tide of filtered) {
    const tideTime = new Date(tide.timestamp).getTime()
    const isDupe = result.some(existing => 
      existing.type === tide.type && 
      Math.abs(new Date(existing.timestamp).getTime() - tideTime) < 30 * 60 * 1000
    )
    if (!isDupe) {
      result.push(tide)
    }
  }
  
  return result
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
</script>
