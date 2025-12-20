<template>
  <div 
    class="bg-white border-2 border-black rounded-[6px] w-full max-w-full overflow-x-hidden"
    :class="[shadowClass, interactive ? 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : '']"
    :style="accentStyle"
  >
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  shadow: { type: String, default: 'md' },
  interactive: { type: Boolean, default: false },
  accentColor: { type: String, default: null },
})

const shadowClass = computed(() => {
  const map = {
    sm: 'sm:shadow-[2px_2px_0px_#000]',
    md: 'sm:shadow-[4px_4px_0px_#000]',
    lg: 'sm:shadow-[6px_6px_0px_#000]',
    none: '',
  }
  return map[props.shadow] || map.md
})

const accentStyle = computed(() => {
  if (!props.accentColor) return {}
  return {
    borderTopColor: props.accentColor,
    borderTopWidth: '5px'
  }
})
</script>
