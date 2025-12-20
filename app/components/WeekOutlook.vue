<template>
  <BrutalCard v-if="summary" class="p-4 sm:p-5">
    <p class="text-card-title mb-2">This Week's Outlook</p>
    <p class="text-body break-words">{{ summary.summary }}</p>
    <p class="text-meta mt-3">Updated {{ formatDate(summary.generated_at) }}</p>
  </BrutalCard>
</template>

<script setup>
defineProps({
  summary: { type: Object, default: null }
})

const formatDate = (date) => {
  if (!date) return '--'
  return new Date(date).toLocaleString()
}
</script>
