<template>
  <BrutalCard class="overflow-hidden">
    <!-- Spot Image (only shown if photo exists) -->
    <div v-if="spot.photo_url" class="h-48 sm:h-64 bg-gray-200 relative">
      <img 
        :src="spot.photo_url" 
        :alt="spot.name"
        class="w-full h-full object-cover"
      />
    </div>
    
    <!-- Description -->
    <div class="p-4 sm:p-6">
      <h2 class="text-card-title mb-3">About {{ spot.name }}</h2>
      <p v-if="spot.description" class="text-body text-gray-600">
        {{ spot.description }}
      </p>
      <p v-else class="text-body text-gray-600">
        {{ defaultDescription }}
      </p>
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
