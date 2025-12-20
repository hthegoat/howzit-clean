<template>
  <BrutalCard class="p-4 sm:p-5">
    <p class="text-card-title mb-3">Spot Info</p>
    <div class="space-y-2 text-sm">
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Skill Level</span>
        <span class="font-bold text-right">{{ info.skill_level }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Best Tide</span>
        <span class="font-bold text-right">{{ info.best_tide }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Best Swell</span>
        <span class="font-bold text-right">{{ formatArray(info.best_swell_direction) }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Best Wind</span>
        <span class="font-bold text-right">{{ formatArray(info.best_wind_direction) }}</span>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
defineProps({
  info: { type: Object, required: true }
})

const formatArray = (arr) => {
  if (!arr) return '--'
  return Array.isArray(arr) ? arr.join(', ') : arr
}
</script>
