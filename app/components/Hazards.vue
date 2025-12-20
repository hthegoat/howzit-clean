<template>
  <div v-if="hazards && hazards.length > 0" class="bg-yellow-50 rounded-[6px] p-4 sm:p-5 border-2 border-black sm:shadow-[2px_2px_0px_#000]">
    <p class="text-card-title mb-3 flex items-center gap-2">
      <span>⚠️</span> Hazards
    </p>
    <ul class="space-y-2 text-sm">
      <li v-for="(hazard, index) in hazards" :key="index" class="flex items-start gap-2">
        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0"></span>
        {{ hazard }}
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  hazards: { type: Array, default: () => [] }
})
</script>
