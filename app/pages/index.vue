<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <!-- Hero -->
    <section class="bg-white border-b-2 border-black">
      <div class="max-w-6xl mx-auto px-3 sm:px-6 py-16 sm:py-24 text-center">
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase mb-6">
          Surf Forecasts<br>That Don't Suck
        </h1>
        <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Real-time conditions. No ads. No bloat. No BS.<br>
          Just the data you need to score waves.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink 
            to="/spots" 
            class="bg-yellow-400 text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            VIEW FORECASTS
          </NuxtLink>
          <NuxtLink 
            to="/waitlist" 
            class="bg-white text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            JOIN WAITLIST
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-16 sm:py-24">
      <div class="max-w-6xl mx-auto px-3 sm:px-6">
        <h2 class="text-3xl sm:text-5xl font-black uppercase text-center mb-12">Why Howzit?</h2>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">📊</div>
            <h3 class="text-xl font-bold mb-2">Real Data, No Hype</h3>
            <p class="text-gray-600">Direct from NOAA buoys and Surfline. We show you what's actually happening, not what gets clicks.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">🎯</div>
            <h3 class="text-xl font-bold mb-2">Smart Ratings</h3>
            <p class="text-gray-600">Our algorithm factors in swell direction, period, wind, and your beach's orientation. Not just wave height.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">🚫</div>
            <h3 class="text-xl font-bold mb-2">Zero Ads</h3>
            <p class="text-gray-600">No pop-ups. No video ads. No "premium" paywalls for basic features. Just forecasts.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">🤖</div>
            <h3 class="text-xl font-bold mb-2">AI Summaries</h3>
            <p class="text-gray-600">Get a quick, human-readable summary of the week's conditions. Know the best day at a glance.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">📱</div>
            <h3 class="text-xl font-bold mb-2">Mobile First</h3>
            <p class="text-gray-600">Built for checking conditions from the parking lot. Fast, clean, and works on any device.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">🌊</div>
            <h3 class="text-xl font-bold mb-2">100+ Spots</h3>
            <p class="text-gray-600">NJ, NY, and NC covered. More spots coming soon. Request yours and we'll add it.</p>
          </BrutalCard>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-16 sm:py-24 bg-white border-y-2 border-black">
      <div class="max-w-6xl mx-auto px-3 sm:px-6">
        <h2 class="text-3xl sm:text-5xl font-black uppercase text-center mb-12">How It Works</h2>
        
        <div class="grid sm:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">1</div>
            <h3 class="text-xl font-bold mb-2">Pick Your Spot</h3>
            <p class="text-gray-600">Browse our coverage map or search for your local break.</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">2</div>
            <h3 class="text-xl font-bold mb-2">Check Conditions</h3>
            <p class="text-gray-600">See real-time wave height, period, wind, and tides all in one place.</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">3</div>
            <h3 class="text-xl font-bold mb-2">Score Waves</h3>
            <p class="text-gray-600">Make better decisions. Spend less time guessing, more time surfing.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 sm:py-24">
      <div class="max-w-4xl mx-auto px-3 sm:px-6 text-center">
        <h2 class="text-3xl sm:text-5xl font-black uppercase mb-6">Ready to Check the Surf?</h2>
        <p class="text-lg text-gray-600 mb-8">Free forever for early users. No credit card required.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink 
            to="/spots" 
            class="bg-yellow-400 text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            VIEW ALL SPOTS →
          </NuxtLink>
          <NuxtLink 
            to="/waitlist" 
            class="bg-white text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            JOIN WAITLIST
          </NuxtLink>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<script setup>
useHead({
  title: 'Howzit - Surf Forecasts That Don\'t Suck'
})
</script>
