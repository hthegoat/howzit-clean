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
        <p class="text-gray-400 text-sm mb-4">Shipping fast. Check out what we're building.</p>
        <NuxtLink 
          to="/spots" 
          class="inline-block bg-black text-white font-bold text-sm px-6 py-3 rounded-[6px] border-2 border-black hover:bg-gray-800 transition-colors"
        >
          EXPLORE ALL SPOTS
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
    date: 'Mar 11, 2026',
    tag: 'fix',
    title: 'Code Health Sweep',
    description: 'Fixed rating algorithm height-cap bug where waves above 3ft could bypass scoring limits. Removed fragile meters-to-feet conversion guard. Optimized spots index page to fetch 99% less forecast data. Added batch support to the forecast ingestion pipeline to prevent timeout at scale.'
  },
  {
    date: 'Mar 11, 2026',
    tag: 'improvement',
    title: 'Dead Code Cleanup',
    description: 'Removed all monetization remnants — waitlist page, pricing page, PricingFeature component, fake user count animation. Cleaned open stats API to remove pro/founding tier references. Everything is free, and now the codebase reflects that.'
  },
  {
    date: 'Mar 3, 2026',
    tag: 'fix',
    title: 'Cron Batch Coverage Extended',
    description: 'Forecast ingestion and AI summary generation cron jobs now cover all 137+ spots. Previously only the first 90 spots were processed — new batches added with proper offsets to reach 150 spots.'
  },
  {
    date: 'Mar 2026',
    tag: 'launch',
    title: 'Everything Is Free',
    description: 'Removed all paid tiers, paywalls, and Stripe checkout flows. Every feature is now free — no Pro tier, no founding member pricing, no SurfGraph paywall overlay. Strategy: grow first, monetize later.'
  },
  {
    date: 'Mar 2026',
    tag: 'improvement',
    title: 'Post-Launch Cleanup',
    description: 'Removed badge system (Worth the Drive / Send It / Stay Local), renamed Better Conditions Nearby to Worth Checking, reordered By State view by spot count descending, replaced all JOIN WAITLIST CTAs with CREATE ACCOUNT.'
  },
  {
    date: 'Mar 2026',
    tag: 'data',
    title: '137 Spots Across 17 States',
    description: 'Expanded coverage to California (25 spots), Oregon (10), and Hawaii (15) — plus continued East Coast growth. Now covering 137 spots from Maine to Maui.'
  },
  {
    date: 'Mar 2026',
    tag: 'data',
    title: 'Rating Algorithm v12 — Region-Aware',
    description: 'Major rating overhaul with 8 surf regions (Northeast, Mid-Atlantic, Outer Banks, Southeast, Florida NE/SE, Gulf, West Coast), each with calibrated period curves, height caps, and skepticism flags. West Coast ground swell gets proper period-based scoring.'
  },
  {
    date: 'Mar 2026',
    tag: 'seo',
    title: 'SEO Infrastructure Upgrade',
    description: 'Dynamic OG meta tags per spot, JSON-LD structured data (Beach schema + FAQ rich snippets), dynamic sitemap with per-spot lastmod timestamps, and default OG image generation.'
  },
  {
    date: 'Feb 11, 2025',
    tag: 'launch',
    title: '$10/Year Early Access Pricing',
    description: 'Launched early access Pro tier at $10/year for the first 1,000 members. Founding member pricing at $99 lifetime. Open stats page goes live.'
  },
  {
    date: 'Feb 10, 2025',
    tag: 'feature',
    title: 'My Spots — Follow Your Favorites',
    description: 'Follow your favorite surf spots and see current conditions at a glance from your account dashboard.'
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
