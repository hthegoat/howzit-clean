<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <!-- Header -->
      <div class="text-center mb-10 sm:mb-14">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-3">Changelog</h1>
        <p class="text-gray-600 max-w-lg mx-auto">
          Every update, shipped. Follow the build in real time.
        </p>
      </div>

      <!-- Timeline -->
      <div class="space-y-0">
        <div 
          v-for="(entry, idx) in changelog" 
          :key="idx"
          class="relative pl-8 pb-8 border-l-2 border-black last:border-transparent"
        >
          <!-- Dot -->
          <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-black" :class="idx === 0 ? 'bg-yellow-400' : 'bg-white'"></div>
          
          <!-- Date -->
          <p class="text-xs font-bold uppercase text-gray-400 mb-1">{{ entry.date }}</p>
          
          <!-- Tag -->
          <span 
            v-if="entry.tag"
            class="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border mb-2"
            :class="tagClass(entry.tag)"
          >
            {{ entry.tag }}
          </span>

          <!-- Title -->
          <h3 class="font-black text-lg mb-1">{{ entry.title }}</h3>
          
          <!-- Description -->
          <p class="text-sm text-gray-600 leading-relaxed">{{ entry.description }}</p>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="mt-12 text-center">
        <p class="text-gray-400 text-sm mb-4">Shipping fast. Want to help shape what's next?</p>
        <NuxtLink 
          to="/pricing" 
          class="inline-block bg-black text-white font-bold text-sm px-6 py-3 rounded-[6px] border-2 border-black hover:bg-gray-800 transition-colors"
        >
          BECOME A MEMBER
        </NuxtLink>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
const tagClass = (tag) => {
  const map = {
    'feature': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'improvement': 'bg-blue-50 text-blue-700 border-blue-200',
    'fix': 'bg-red-50 text-red-700 border-red-200',
    'data': 'bg-purple-50 text-purple-700 border-purple-200',
    'launch': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'seo': 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return map[tag] || 'bg-gray-50 text-gray-700 border-gray-200'
}

const changelog = [
  {
    date: 'Feb 11, 2025',
    tag: 'launch',
    title: '$10/Year Early Access Pricing',
    description: 'Launched early access Pro tier at $10/year for the first 1,000 members. Founding member pricing dropped to $99 lifetime. Open stats page goes live.'
  },
  {
    date: 'Feb 10, 2025',
    tag: 'feature',
    title: 'Pro Paywall & Stripe Integration',
    description: 'Full payment infrastructure with Stripe checkout, webhook handling, and subscription management. Free users get 4-day forecasts, Pro unlocks the full 7-day view.'
  },
  {
    date: 'Feb 10, 2025',
    tag: 'feature',
    title: 'My Spots — Follow Your Favorites',
    description: 'Follow your favorite surf spots and see current conditions at a glance from your account dashboard.'
  },
  {
    date: 'Feb 7, 2025',
    tag: 'improvement',
    title: 'Landing Page Data Source Fix',
    description: 'Updated landing page to accurately reflect our data sources: NOAA buoys, ECMWF, and Open-Meteo models. Removed incorrect Surfline reference.'
  },
  {
    date: 'Feb 6, 2025',
    tag: 'feature',
    title: 'Admin Dashboard for Pipeline Health',
    description: 'Built internal monitoring to track forecast freshness, buoy data health, AI summary generation, and overall system status across all 76 spots.'
  },
  {
    date: 'Feb 3, 2025',
    tag: 'seo',
    title: 'SSR Overhaul for Google Indexing',
    description: 'Migrated all spot pages from client-side to server-side rendering. Google was seeing empty shells — now it sees full forecasts, ratings, and conditions. Added ISR caching and fixed sitemap timestamps.'
  },
  {
    date: 'Jan 29, 2025',
    tag: 'data',
    title: 'Rating Algorithm v10',
    description: 'Tenth iteration of the Howzit rating system. More conservative scoring, location-specific tuning, proper swell period weighting, and wind factor calibration. Epic ratings now actually mean epic.'
  },
  {
    date: 'Jan 2025',
    tag: 'feature',
    title: 'Multi-Model Forecast Blending',
    description: 'Blending forecasts from Open-Meteo, WaveWatch III, and ECMWF with confidence scoring based on model agreement. Three models, one honest rating.'
  },
  {
    date: 'Dec 2024',
    tag: 'data',
    title: '76 East Coast Spots Live',
    description: 'Full coverage from Maine to Florida — 76 surf spots across 14 states with forecasts, buoy data, tides, and AI-generated daily summaries.'
  },
  {
    date: 'Nov 2024',
    tag: 'launch',
    title: 'Howzit Goes Live',
    description: 'First public version of Howzit. Built because Surfline felt like a black box and surfers deserve to know where the numbers come from.'
  }
]

useHead({
  title: 'Changelog - Howzit',
  meta: [
    { name: 'description', content: 'Follow Howzit\'s build log — every feature, fix, and update shipped to the indie surf forecast platform.' },
    { property: 'og:title', content: 'Changelog - Howzit' },
    { property: 'og:description', content: 'Every update, shipped. Follow the indie surf forecast build in real time.' },
  ]
})
</script>
