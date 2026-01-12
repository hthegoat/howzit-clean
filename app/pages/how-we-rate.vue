<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-4">How We Rate</h1>
        <p class="text-lg text-gray-600">
          Our rating system is designed by surfers, for surfers. No black boxes—here's exactly how we calculate conditions.
        </p>
      </div>

      <!-- Rating Scale -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">The Rating Scale</h2>
        
        <div class="space-y-4">
          <div class="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-lg">
            <div class="w-16 h-10 rounded" style="background-color: #10b981;"></div>
            <div>
              <p class="font-bold text-lg">Epic / Good</p>
              <p class="text-gray-600 text-sm">Clean conditions, quality waves. Get out there.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-lg">
            <div class="w-16 h-10 rounded" style="background-color: #3b82f6;"></div>
            <div>
              <p class="font-bold text-lg">Fair</p>
              <p class="text-gray-600 text-sm">Surfable conditions. Not perfect, but worth a paddle.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-lg">
            <div class="w-16 h-10 rounded" style="background-color: #fb7185;"></div>
            <div>
              <p class="font-bold text-lg">Poor</p>
              <p class="text-gray-600 text-sm">Choppy, weak, or blown out. For the dedicated only.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-lg">
            <div class="w-16 h-10 rounded" style="background-color: #d1d5db;"></div>
            <div>
              <p class="font-bold text-lg">Flat</p>
              <p class="text-gray-600 text-sm">Nothing to ride. Time for a coffee instead.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Factors -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">What We Measure</h2>
        
        <div class="grid sm:grid-cols-2 gap-6">
          <BrutalCard class="p-5">
            <div class="text-3xl mb-3">🌊</div>
            <h3 class="font-bold text-lg mb-2">Wave Height</h3>
            <p class="text-gray-600 text-sm">
              Size matters, but it's not everything. We look at both swell height and wind wave height separately. Ground swell > wind chop.
            </p>
          </BrutalCard>
          
          <BrutalCard class="p-5">
            <div class="text-3xl mb-3">⏱️</div>
            <h3 class="font-bold text-lg mb-2">Wave Period</h3>
            <p class="text-gray-600 text-sm">
              The secret sauce. 10+ seconds means organized, powerful waves. Under 6 seconds is usually choppy wind swell. We weight period heavily.
            </p>
          </BrutalCard>
          
          <BrutalCard class="p-5">
            <div class="text-3xl mb-3">🧭</div>
            <h3 class="font-bold text-lg mb-2">Swell Direction</h3>
            <p class="text-gray-600 text-sm">
              Each beach has an ideal swell window. We know if your spot faces SE and the swell is coming from the NE—you're in the shadow.
            </p>
          </BrutalCard>
          
          <BrutalCard class="p-5">
            <div class="text-3xl mb-3">💨</div>
            <h3 class="font-bold text-lg mb-2">Wind Speed & Direction</h3>
            <p class="text-gray-600 text-sm">
              Offshore wind = clean faces. Onshore = bumpy mess. We calculate wind quality relative to each beach's orientation, not just raw speed.
            </p>
          </BrutalCard>
        </div>
      </section>

      <!-- The Algorithm -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">The Algorithm</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 space-y-6">
          <div>
            <h3 class="font-bold mb-2">Wave Score (0-65 points)</h3>
            <p class="text-gray-600 text-sm mb-3">
              Combines wave height, period quality, and swell-to-chop ratio. A clean 3ft wave with 10s period scores higher than a choppy 5ft wave with 5s period.
            </p>
            <div class="bg-gray-100 p-3 rounded font-mono text-xs">
              wave_score = height_score + period_score - chop_penalty
            </div>
          </div>
          
          <div>
            <h3 class="font-bold mb-2">Wind Score (0-35 points)</h3>
            <p class="text-gray-600 text-sm mb-3">
              Based on wind direction relative to the beach, modified by speed. Light offshore = 35 points. Strong onshore = 5 points.
            </p>
            <div class="bg-gray-100 p-3 rounded font-mono text-xs">
              wind_score = direction_score × speed_modifier
            </div>
          </div>
          
          <div>
            <h3 class="font-bold mb-2">Final Rating (0-100)</h3>
            <p class="text-gray-600 text-sm mb-3">
              Wave score + wind score, with caps for truly bad conditions (blown out, flat, or dangerously large).
            </p>
            <div class="bg-gray-100 p-3 rounded font-mono text-xs">
              rating = min(wave_score + wind_score, condition_caps)
            </div>
          </div>
        </div>
      </section>

      <!-- Beach Orientation -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Beach Orientation Matters</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6">
          <p class="text-gray-600 mb-4">
            Every spot in our system has a configured beach orientation (the direction it faces). This is crucial because:
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex gap-2">
              <span class="text-green-600">✓</span>
              <span>A SE-facing beach needs SE swell to light up</span>
            </li>
            <li class="flex gap-2">
              <span class="text-green-600">✓</span>
              <span>Wind from the NW is offshore for east-facing beaches</span>
            </li>
            <li class="flex gap-2">
              <span class="text-green-600">✓</span>
              <span>The same swell can be pumping at one spot and flat at another</span>
            </li>
          </ul>
          <p class="text-gray-600 mt-4">
            This is why our ratings differ by spot—we're not just showing you buoy data, we're interpreting it for each specific beach.
          </p>
        </div>
      </section>

      <!-- Data Sources -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Our Data Sources</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 mb-6">
          <h3 class="font-bold text-lg mb-3">Multi-Model Wave Forecasts</h3>
          <p class="text-gray-600 text-sm mb-4">
            We blend three independent wave models to give you more accurate forecasts. Each model has strengths—by combining them, we reduce the chance of any single model leading you astray.
          </p>
          
          <div class="grid sm:grid-cols-3 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-bold text-sm mb-1">WaveWatch III</h4>
              <p class="text-xs text-gray-500 mb-2">NOAA / NCEP</p>
              <p class="text-gray-600 text-xs">US government model. Great for detecting incoming swells and short-period wind events. Uses GFS wind data.</p>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-bold text-sm mb-1">ECMWF WAM</h4>
              <p class="text-xs text-gray-500 mb-2">European Centre</p>
              <p class="text-gray-600 text-xs">The European gold standard. Excellent medium-range accuracy (3-7 days). Often considered the world's best weather model.</p>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-bold text-sm mb-1">Open-Meteo</h4>
              <p class="text-xs text-gray-500 mb-2">Multi-model ensemble</p>
              <p class="text-gray-600 text-xs">Aggregates multiple sources with detailed swell component separation. Good baseline data.</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 mb-6">
          <h3 class="font-bold text-lg mb-3">How We Blend</h3>
          <p class="text-gray-600 text-sm mb-4">
            Our algorithm compares all three models for each forecast hour and calculates a confidence level:
          </p>
          
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="text-emerald-600 font-bold">✓ High Confidence</span>
              <span class="text-gray-600 text-sm">All models agree within 0.5ft — we average them</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-amber-600 font-bold">~ Medium Confidence</span>
              <span class="text-gray-600 text-sm">Two models agree, one differs — we weight toward the agreeing pair</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-red-500 font-bold">? Low Confidence</span>
              <span class="text-gray-600 text-sm">Models diverge significantly — we use the median and flag uncertainty</span>
            </div>
          </div>
          
          <p class="text-gray-500 text-xs mt-4">
            You can toggle between individual models in the Surf Graph to see how they differ.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="bg-white border-2 border-black rounded-lg p-5">
            <h3 class="font-bold mb-2">Tide Data</h3>
            <p class="text-gray-600 text-sm">NOAA CO-OPS — Official tide predictions for nearest stations</p>
          </div>
          
          <div class="bg-white border-2 border-black rounded-lg p-5">
            <h3 class="font-bold mb-2">Water Temperature</h3>
            <p class="text-gray-600 text-sm">Open-Meteo sea surface temperature data</p>
          </div>
          
          <div class="bg-white border-2 border-black rounded-lg p-5">
            <h3 class="font-bold mb-2">AI Summaries</h3>
            <p class="text-gray-600 text-sm">Claude by Anthropic — Generates plain-English forecast summaries from blended data</p>
          </div>
          
          <div class="bg-white border-2 border-black rounded-lg p-5">
            <h3 class="font-bold mb-2">Buoy Data</h3>
            <p class="text-gray-600 text-sm">NDBC buoys — Real-time wave observations where available</p>
          </div>
        </div>
      </section>

      <!-- Disclaimer -->
      <section class="mb-12">
        <div class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h3 class="font-bold mb-2">⚠️ A Note on Accuracy</h3>
          <p class="text-gray-700 text-sm">
            No forecast is perfect. We're working with model data, not magic. Conditions can change rapidly, 
            and local factors (sandbars, jetties, bathymetry) affect wave quality in ways no algorithm can fully capture. 
            Use Howzit as a guide, but trust your eyes when you get to the beach. If it looks good, paddle out.
          </p>
        </div>
      </section>

      <!-- CTA -->
      <section class="text-center">
        <h2 class="text-2xl font-black uppercase mb-4">Ready to Check the Forecast?</h2>
        <NuxtLink 
          to="/spots" 
          class="inline-block bg-yellow-400 text-black font-bold px-8 py-4 text-lg border-2 border-black rounded-[6px] shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          VIEW ALL SPOTS →
        </NuxtLink>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const siteUrl = 'https://www.hwztsurf.com'

useHead({
  title: 'How We Rate - Howzit',
  meta: [
    { name: 'description', content: 'Learn how Howzit calculates surf conditions. Our transparent rating algorithm factors in wave height, period, swell direction, and wind to give you accurate forecasts.' },
    { property: 'og:title', content: 'How We Rate - Howzit' },
    { property: 'og:description', content: 'Learn how Howzit calculates surf conditions. Our transparent rating algorithm explained.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/how-we-rate` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/how-we-rate` }
  ]
})
</script>
