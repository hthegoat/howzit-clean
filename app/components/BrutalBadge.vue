<template>
  <span 
    class="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black rounded-[6px] shadow-[2px_2px_0px_#000]"
    :style="{ backgroundColor: bgColor }"
  >
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' }
})

const colorMap = {
  epic: '#22c55e',
  good: '#4ade80',
  fair: '#facc15',
  poor: '#fb923c',
  flat: '#f87171',
  default: '#ffffff',
}

const bgColor = computed(() => colorMap[props.variant] || colorMap.default)
</script>
