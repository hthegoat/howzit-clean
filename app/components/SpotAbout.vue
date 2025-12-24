<template>
  <BrutalCard class="overflow-hidden">
    <!-- Spot Image -->
    <div class="h-48 sm:h-64 bg-gray-200 relative">
      <img 
        v-if="spot.photo_url" 
        :src="spot.photo_url" 
        :alt="spot.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    
    <!-- Description -->
    <div class="p-4 sm:p-6">
      <h3 class="text-card-title mb-3">About {{ spot.name }}</h3>
      <p v-if="spot.description" class="text-body text-gray-600 mb-4">
        {{ spot.description }}
      </p>
      <p v-else class="text-body text-gray-600 mb-4">
        {{ defaultDescription }}
      </p>
      
      <!-- Quick Facts -->
      <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
        <div class="min-w-0">
          <p class="text-meta">Break Type</p>
          <p class="font-bold">{{ spot.break_type || 'Beach Break' }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-meta">Bottom</p>
          <p class="font-bold">{{ spot.bottom_type || 'Sand' }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-meta">Crowd</p>
          <p class="font-bold">{{ spot.crowd_level || 'Moderate' }}</p>
        </div>
        <div class="min-w-0">
          <p class="text-meta">Parking</p>
          <p class="font-bold">{{ spot.parking || 'Street/Lot' }}</p>
        </div>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spot: { type: Object, required: true }
})

const defaultDescription = computed(() => {
  return `${props.spot.name} is a popular surf spot located in ${props.spot.region}, ${props.spot.state}. Known for consistent waves and accessible conditions, it's a favorite among local surfers. Check the forecast above for current conditions and plan your session.`
})
</script>
