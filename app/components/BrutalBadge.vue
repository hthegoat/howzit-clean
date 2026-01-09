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
  epic: '#10b981',
  good: '#10b981',
  fair: '#3b82f6',
  poor: '#fb7185',
  flat: '#d1d5db',
  default: '#ffffff',
}

const bgColor = computed(() => colorMap[props.variant] || colorMap.default)
</script>
