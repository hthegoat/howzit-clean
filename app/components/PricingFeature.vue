<template>
  <div class="flex items-start gap-2 text-sm" :class="{ 'text-gray-400': soon }">
    <span v-if="star" class="text-yellow-500 shrink-0 leading-5">★</span>
    <span v-else-if="soon" class="text-gray-300 shrink-0 leading-5">◇</span>
    <span v-else class="text-green-600 shrink-0 leading-5">✓</span>
    <span :class="{ 'font-semibold': bold }">
      <slot /><span v-if="soon" class="text-[11px] ml-0.5">(coming soon)</span>
    </span>
  </div>
</template>

<script setup>
defineProps({
  bold: { type: Boolean, default: false },
  soon: { type: Boolean, default: false },
  star: { type: Boolean, default: false }
})
</script>
