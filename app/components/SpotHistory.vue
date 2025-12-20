<template>
  <BrutalCard class="p-4 sm:p-5">
    <p class="text-card-title mb-3">Recent History</p>
    
    <div v-if="history.length" class="space-y-2">
      <div v-for="day in history" :key="day.date" class="flex justify-between items-center text-sm">
        <span class="text-gray-600">{{ day.date }}</span>
        <div class="flex items-center gap-3">
          <span class="font-mono font-bold">{{ day.waves }}</span>
          <span class="text-meta">{{ day.rating }}</span>
        </div>
      </div>
    </div>
    
    <div v-else class="text-meta text-center py-4">
      No recent history available
    </div>
  </BrutalCard>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  spot: { type: Object, default: null }
})

const history = ref([])

onMounted(async () => {
  // Placeholder - would fetch from surfline_forecasts for past days
  // For now showing static example
  if (props.spot) {
    history.value = [
      { date: 'Yesterday', waves: '2-3ft', rating: 'Fair' },
      { date: '2 days ago', waves: '1-2ft', rating: 'Poor' },
      { date: '3 days ago', waves: '3-4ft', rating: 'Good' },
    ]
  }
})
</script>
