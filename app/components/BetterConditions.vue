<template>
  <BrutalCard v-if="shouldShow" class="p-4 sm:p-5">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <p class="text-[10px] uppercase tracking-[1.5px] font-bold text-emerald-700">
        Worth Checking
      </p>
    </div>

    <!-- Spot list -->
    <div class="space-y-2">
      <NuxtLink
        v-for="(spot, i) in rankedSpots"
        :key="spot.slug"
        :to="`/spots/${spot.slug}`"
        class="flex items-center justify-between gap-3 p-2.5 -mx-1 border border-gray-200 rounded-md hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-sm font-black text-emerald-500 w-5 shrink-0">#{{ i + 1 }}</span>
          <div class="min-w-0">
            <p class="font-bold text-[13px] truncate">{{ spot.name }}</p>
            <p class="text-[11px] text-gray-500 truncate">{{ spot.conditionSummary }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <BrutalBadge :variant="spot.label.toLowerCase()" class="!text-[10px] !px-2 !py-0.5 !shadow-[1px_1px_0px_#000]">
            {{ spot.label }}
          </BrutalBadge>
          <span class="text-[11px] text-gray-400 w-12 text-right">{{ spot.distance }} mi</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-if="rankedSpots.length === 0" class="text-center py-3 text-[12px] text-gray-400">
      No spots rated better right now. Check back tomorrow.
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spots: { type: Array, default: () => [] },
  currentLabel: { type: String, default: 'Flat' }
})

const { formatDirection } = useHowzitRating()

// Build condition summary strings and filter
const rankedSpots = computed(() => {
  return props.spots.map(s => {
    // Build "4ft @ 9s • Offshore • Clean" style summary
    const parts = []
    const height = s.blended_wave_height ?? s.wave_height
    if (height) parts.push(`${Math.round(height * 3.281)}ft`)
    const period = s.swell_wave_period || s.wave_period
    if (period) parts.push(`@ ${Math.round(period)}s`)
    
    // Wind quality relative to beach orientation
    if (s.wind_direction != null && s.orientation) {
      const offshoreDir = (s.orientation + 180) % 360
      let diff = Math.abs(s.wind_direction - offshoreDir)
      if (diff > 180) diff = 360 - diff
      if (diff <= 60) parts.push('Offshore')
      else if (diff <= 120) parts.push('Sideshore')
      else parts.push('Onshore')
    }

    return {
      ...s,
      conditionSummary: parts.join(' • ')
    }
  })
})

// Show if there are better spots, OR if flat (to show empty state)
const shouldShow = computed(() => {
  return props.spots.length > 0 || props.currentLabel === 'Flat'
})
</script>
