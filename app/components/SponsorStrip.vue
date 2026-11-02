<template>
  <!-- Thin strip flush with the bottom of SpotHero. The negative margins
       cancel the hero card's p-4 sm:p-6 so it spans edge to edge. -->
  <a
    :href="link"
    :target="sponsor ? '_blank' : null"
    :rel="sponsor ? 'sponsored noopener' : null"
    class="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-4 flex items-center justify-between gap-3 min-h-[44px] px-4 sm:px-6 border-t-2 border-black font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-black no-underline"
    :class="sponsor ? 'bg-white hover:bg-gray-50' : 'bg-[#FFFBEB] hover:bg-[#FEF3C7]'"
  >
    <span class="min-w-0 truncate">
      <template v-if="sponsor">
        Forecast presented by
        <span class="bg-[#FACC15] px-1.5 py-px border-[1.5px] border-black rounded-[3px]">{{ sponsor.business_name }}</span>
      </template>
      <template v-else>
        Forecast sponsor:
        <span class="bg-[#FACC15] px-1.5 py-px border-[1.5px] border-black rounded-[3px]">open</span>
      </template>
    </span>
    <span class="shrink-0 flex items-center gap-1.5">
      <span v-if="!sponsor" class="hidden sm:inline">Sponsor for {{ price }}/mo</span>
      <span v-if="!sponsor" class="sm:hidden">{{ price }}/mo</span>
      <svg v-if="sponsor" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
      <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  </a>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spotName: { type: String, required: true },
  spotSlug: { type: String, default: '' },
  sponsor: { type: Object, default: null }
})

const { sponsorMailto, sponsorHref, price } = useSponsor()

// A sponsor without a usable URL falls back to the open-slot mailto rather
// than rendering a dead link.
const link = computed(() =>
  (props.sponsor && sponsorHref(props.sponsor, props.spotSlug)) || sponsorMailto(props.spotName)
)
</script>
