<template>
  <!-- Sponsored -->
  <section
    v-if="sponsor"
    aria-label="Forecast sponsor"
    class="bg-white border-2 border-black border-t-[6px] border-t-[#FACC15] rounded-[6px] sm:shadow-[4px_4px_0px_#000] w-full max-w-full"
    :class="compact ? 'p-4 flex flex-col gap-3' : 'p-4 sm:p-5 flex flex-col gap-3.5'"
  >
    <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-600">Forecast sponsor</p>

    <div class="flex items-center gap-3.5 min-w-0">
      <img
        v-if="sponsor.logo_url"
        :src="sponsor.logo_url"
        :alt="`${sponsor.business_name} logo`"
        class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 object-contain border-2 border-black rounded-[6px] bg-white"
        loading="lazy"
      >
      <div
        v-else
        aria-hidden="true"
        class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center bg-[#FACC15] border-2 border-black rounded-[6px] font-black text-xl"
      >{{ initials }}</div>
      <div class="min-w-0">
        <p class="text-xl font-black leading-tight break-words">{{ sponsor.business_name }}</p>
        <p v-if="sponsor.location_label" class="mt-1 text-xs font-bold uppercase tracking-wide text-gray-600 break-words">{{ sponsor.location_label }}</p>
      </div>
    </div>

    <p v-if="sponsor.tagline && !compact" class="text-[15px] leading-relaxed break-words">{{ sponsor.tagline }}</p>

    <span
      v-if="sponsor.offer"
      class="self-start bg-[#FACC15] border-2 border-black rounded-[6px] shadow-[2px_2px_0px_#000] px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide break-words"
    >{{ sponsor.offer }}</span>

    <a
      v-if="href"
      :href="href"
      target="_blank"
      rel="sponsored noopener"
      class="flex items-center justify-center gap-2 min-h-[48px] px-4 bg-white text-black border-2 border-black rounded-[6px] shadow-[3px_3px_0px_#000] font-extrabold text-[15px] uppercase tracking-wide no-underline active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <span class="truncate">Visit {{ sponsor.business_name }}</span>
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
    </a>

    <p v-if="!compact" class="font-mono text-[11px] font-semibold uppercase tracking-wide text-gray-600">Sponsors never touch the forecast.</p>
  </section>

  <!-- Open slot: compact (mobile, under the hero) -->
  <section
    v-else-if="compact"
    aria-label="Forecast sponsor"
    class="bg-[#FACC15] border-2 border-black rounded-[6px] p-4 flex items-center gap-3 w-full max-w-full"
  >
    <div class="min-w-0 flex-1">
      <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] mb-0.5">Forecast sponsor</p>
      <p class="text-lg font-black leading-tight">Your shop here. {{ price }}/mo.</p>
    </div>
    <a
      :href="mailto"
      class="shrink-0 flex items-center justify-center min-h-[44px] px-4 bg-black text-white rounded-[6px] font-extrabold text-[13px] uppercase tracking-wide no-underline"
    >Sponsor</a>
  </section>

  <!-- Open slot: full card (desktop, right column) -->
  <section
    v-else
    aria-label="Forecast sponsor"
    class="bg-[#FACC15] border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] p-4 sm:p-5 flex flex-col gap-3.5 w-full max-w-full"
  >
    <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]">Forecast sponsor</p>
    <p class="text-3xl font-black leading-[1.05]">YOUR SHOP<br>HERE.</p>
    <p class="text-[15px] leading-relaxed">Every surfer checking {{ spotName }} sees your name, every day. One sponsor per spot.</p>
    <div class="flex items-baseline gap-1.5 border-t-2 border-black pt-3">
      <span class="font-mono text-[32px] font-semibold leading-none">{{ price }}</span>
      <span class="font-mono text-[13px] font-semibold uppercase">/ month</span>
    </div>
    <a
      :href="mailto"
      class="flex items-center justify-center gap-2 min-h-[48px] px-4 bg-black text-white border-2 border-black rounded-[6px] font-extrabold text-[15px] uppercase tracking-wide no-underline"
    >
      <span class="truncate">Sponsor {{ spotName }}</span>
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </a>
    <p class="font-mono text-[11px] font-semibold uppercase tracking-wide">Month to month. Cancel anytime.</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spotName: { type: String, required: true },
  spotSlug: { type: String, default: '' },
  sponsor: { type: Object, default: null },
  // Compact: the mobile version that sits right under the hero.
  compact: { type: Boolean, default: false }
})

const { sponsorMailto, sponsorHref, price } = useSponsor()

const mailto = computed(() => sponsorMailto(props.spotName))
const href = computed(() => sponsorHref(props.sponsor, props.spotSlug))

const initials = computed(() => {
  const name = props.sponsor?.business_name || ''
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
})
</script>
