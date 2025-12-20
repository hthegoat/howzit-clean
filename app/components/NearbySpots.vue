<template>
  <BrutalCard v-if="spots.length" class="p-4 sm:p-5">
    <p class="text-card-title mb-3">Nearby Spots</p>
    <div class="space-y-2">
      <NuxtLink 
        v-for="spot in filteredSpots" 
        :key="spot.slug"
        :to="`/spots/${spot.slug}`"
        class="flex justify-between items-center p-2 -mx-2 rounded hover:bg-gray-100 transition-colors"
      >
        <span class="font-medium">{{ spot.name }}</span>
        <span class="text-meta">{{ spot.distance }}</span>
      </NuxtLink>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spots: { type: Array, default: () => [] },
  currentSlug: { type: String, default: '' }
})

const filteredSpots = computed(() => {
  return props.spots.filter(s => s.slug !== props.currentSlug).slice(0, 4)
})
</script>
