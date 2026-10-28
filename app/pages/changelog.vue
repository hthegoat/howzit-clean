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
    'change': 'bg-gray-100 text-gray-700 border-gray-300',
  }
  return map[tag] || 'bg-gray-50 text-gray-700 border-gray-200'
}

const changelog = [
  {
    date: 'Oct 28, 2026',
    tag: 'fix',
    title: 'Removed Placeholder Spot History',
    description: 'Spot pages had a history card showing sample numbers, not real past conditions. It is gone until there is real data behind it. Also tightened database permissions on AI summaries and feedback, and retired three unused backend functions.'
  },
  {
    date: 'Oct 20, 2026',
    tag: 'fix',
    title: 'Forecasts Back to Full Coverage, Summaries in Local Time',
    description: 'For about a week, a slow wave-model server was stalling the forecast refresh, so up to half the spots were showing day-old data. Every request now has a timeout, spots refresh a few at a time, and WaveWatch III falls back to NOAA GFS-Wave (the same model, served from a host that answers) when the usual source is down. The AI summaries were also reading the clock in UTC, which meant "Tuesday morning" could be built from Monday evening numbers. They now work in each spot\'s local time. Spot and state pages for addresses that don\'t exist now return a proper not-found page, and the markdown endpoints for AI agents (/spots/{spot}.md) work again.'
  },
  {
    date: 'Aug 17, 2026',
    tag: 'change',
    title: 'Wave Energy Now Reads in kJ',
    description: 'The wave energy card now reports kilojoules per metre of crest — how much energy one wave delivers to each metre of beach — instead of kilowatts per metre, which was energy per second. Same physics, integrated over one wave period, and the scale surfers already read elsewhere. One real consequence: period now counts twice as hard, because a longer wave is both more powerful and takes longer to pass. 3ft at 16 seconds is now four times 3ft at 8 seconds rather than twice, which is the correct answer and the whole reason the number exists. Every band threshold was re-derived against real days rather than rescaled.'
  },
  {
    date: 'Aug 17, 2026',
    tag: 'improvement',
    title: 'Spot Page Cards Unified',
    description: 'The surf graph, tide forecast, wave energy and hazards cards were each drawing their own border, corner radius and drop shadow instead of using the shared card. The surf graph and tide graph had no shadow at all and a slightly rounder corner, so they sat flat against the page while everything around them was raised. All four now run through the same card component, so the whole page lines up.'
  },
  {
    date: 'Aug 16, 2026',
    tag: 'feature',
    title: 'Buoy Check — Models vs. Reality',
    description: 'Every spot with a live buoy now shows a straight-up accountability table at the top of the page: what each model predicted for right now, next to what the buoy is actually measuring in the water, with the miss for each one. If the models are running a foot hot, you see it. If the buoy sensor is down, we say that instead of pretending. No other forecast site shows you this, because no other forecast site wants you checking their work.'
  },
  {
    date: 'Aug 16, 2026',
    tag: 'change',
    title: 'Accounts Removed',
    description: 'Sign in is gone from the site. There was nothing behind it worth the friction — every forecast, every spot, every model was already free and open without an account, so the button was asking for an email address in exchange for nothing. No signup, no login, no account. Just open a spot and read the water.'
  },
  {
    date: 'Aug 14, 2026',
    tag: 'fix',
    title: 'West Coast and Hawaii Ratings Corrected',
    description: 'Fifty spots — all of California, Oregon and Hawaii — were being rated on the East Coast calibration, because their regions were missing from the rating config and were quietly falling through to the default. That meant no credit for long-period groundswell and an East Coast ceiling on wave height, so a 3ft 13-second south swell in San Diego topped out at the same score as a 3ft windswell day in New Jersey. California and Oregon now use the West Coast calibration, and Hawaii has its own: stricter on trade wind slop, far more generous above 14 seconds, and weighted hard on swell direction, because a North Shore spot and a South Shore spot are opposite seasons.'
  },
  {
    date: 'Aug 14, 2026',
    tag: 'change',
    title: 'Model Agreement Chart Removed',
    description: 'The model agreement band is gone from spot pages. Three forecast models still run behind every number and the surf graph still lets you switch between them — that has not changed. The chart itself was just showing you the argument instead of the answer.'
  },
  {
    date: 'Aug 14, 2026',
    tag: 'feature',
    title: 'Wave Energy',
    description: 'Wave energy now has its own card on every spot page: how much power is actually in the water, in kilowatts per metre of wave crest. It is the number that separates 3ft at 16 seconds from 3ft at 8 seconds — same height on the report, completely different day in the water. Drag across the chart to scrub through the week; the stack shows groundswell in yellow and wind chop hatched on top, so you can see whether a big number is organised swell or just a lot of disorganised water. High energy does not mean good surf, only powerful surf: 20 kW/m under a hard onshore is still a washing machine.'
  },
  {
    date: 'Aug 14, 2026',
    tag: 'fix',
    title: 'WaveWatch III Restored',
    description: 'WaveWatch III had gone dark on every spot, leaving the model comparison running on two models instead of three. Two causes: the NOAA mirror we were pulling from stopped accepting connections from our servers entirely, and our request was asking for a forecast window one day longer than the model actually publishes, which the server rejected outright. We now pull from the University of Hawaii server that runs the model in the first place, and ask for exactly as much as it has. All 149 spots are back on three models.'
  },
  {
    date: 'Aug 5, 2026',
    tag: 'fix',
    title: 'AI Summaries Restored',
    description: 'Fixed a silent failure where every spot\'s AI forecast summary had been failing to generate since June — a retired model reference was causing every request to error out invisibly. Switched to Claude Haiku 4.5 and backfilled fresh summaries across all 149 spots.'
  },
  {
    date: 'Jul 28, 2026',
    tag: 'feature',
    title: 'Model Agreement Chart',
    description: 'Every spot page now shows how much the three wave models actually agree. A yellow band spans the full range across Open-Meteo, WaveWatch III and ECMWF, with the blend drawn through it as a black line. Narrow band means the call is solid. Wide band means it is a guess, and now you can see that instead of being told a single confident number.'
  },
  {
    date: 'Jul 28, 2026',
    tag: 'fix',
    title: 'Ocean Cell Fix for WW3 and ECMWF',
    description: 'Roughly 53 spots were silently snapping to land cells on the 0.5-degree global grid, which returns a valid response full of empty values rather than an error. The ingest now scans a 3x3 box around each spot, throws out the dry cells, and locks onto the nearest one with real water data. ECMWF got sea-cell selection and empty-series detection on top.'
  },
  {
    date: 'Jul 27, 2026',
    tag: 'data',
    title: '149 Spots — 12 New New Jersey Breaks',
    description: 'Added Sea Bright through Ocean City, bringing New Jersey to 24 spots and the site to 149 across 17 states. Tide stations split properly between Sandy Hook for the north and Atlantic City for LBI south, and Sandy Hook moved off the dead 44025 buoy onto 44091.'
  },
  {
    date: 'Jul 27, 2026',
    tag: 'improvement',
    title: 'Forecast Retention Policy',
    description: 'All three models now pull a consistent 7-day window, and a daily purge clears rows older than two weeks. The forecasts table had grown to 646,000 rows and 350MB of mostly stale data. It now sits around 84,000 rows and queries noticeably faster.'
  },
  {
    date: 'Jul 26, 2026',
    tag: 'feature',
    title: 'Instant Spot Search',
    description: 'Cmd+K from anywhere on the site opens a search palette across all 149 spots. Type a spot, region, or state, arrow through the results, hit enter. No more scrolling the index to find your break.'
  },
  {
    date: 'Jun 2026',
    tag: 'seo',
    title: 'Spot Pages Lead With What Matters',
    description: 'Page titles and descriptions now surface the facts people actually search for — the swell direction a spot wants, the wind that grooms it, and what kind of break it is — instead of a wave height that changes every hour.'
  },
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
