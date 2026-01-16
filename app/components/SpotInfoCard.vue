<template>
  <BrutalCard class="p-4 sm:p-5">
    <p class="text-card-title mb-3">Spot Info</p>
    <div class="space-y-2 text-sm">
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Break Type</span>
        <span class="font-bold text-right">{{ info.break_type }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Bottom</span>
        <span class="font-bold text-right">{{ info.bottom_type }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Skill Level</span>
        <span class="font-bold text-right">{{ info.skill_level }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Crowd</span>
        <span class="font-bold text-right">{{ info.crowd_level }}</span>
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
      <div v-if="info.parking_info" class="flex justify-between gap-2">
        <span class="text-gray-500">Parking</span>
        <span class="font-bold text-right">{{ info.parking_info }}</span>
      </div>
    </div>
    
    <!-- Local Tips -->
    <div v-if="info.local_tips" class="mt-4 pt-4 border-t border-gray-200">
      <p class="text-xs font-bold text-gray-500 uppercase mb-2">Local Tip</p>
      <p class="text-sm text-gray-700">{{ info.local_tips }}</p>
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
