<template>
  <BrutalCard class="p-4 sm:p-5">
    <p class="text-card-title mb-3">Live Reports</p>
    
    <div v-if="reports.length" class="space-y-3">
      <div v-for="report in reports" :key="report.id" class="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
        <div class="flex justify-between items-start mb-1">
          <span class="font-medium text-sm">{{ report.author }}</span>
          <span class="text-meta">{{ formatTime(report.created_at) }}</span>
        </div>
        <p class="text-sm text-gray-600">{{ report.text }}</p>
      </div>
    </div>
    
    <div v-else class="text-center py-4">
      <p class="text-meta mb-2">No reports yet today</p>
      <button 
        @click="showModal = true"
        class="text-sm font-bold text-blue-600 hover:underline"
      >
        Be the first to report
      </button>
    </div>
  </BrutalCard>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  spotId: { type: String, default: '' }
})

const reports = ref([])
const showModal = ref(false)

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  return date.toLocaleDateString()
}
</script>
