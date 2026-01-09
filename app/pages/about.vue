<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-4">About Howzit</h1>
        <p class="text-lg text-gray-600">
          Built by a surfer who got tired of the same old forecast apps.
        </p>
      </div>

      <!-- The Story -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">The Story</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 space-y-4 text-gray-700">
          <p>
            I'm Harrison, and I surf the Jersey Shore. Like most East Coast surfers, I've spent years refreshing forecast apps, 
            squinting at confusing charts, and driving to the beach only to find conditions nothing like what was predicted.
          </p>
          <p>
            The big forecast sites are cluttered with ads, paywalled features, and ratings that don't match reality. 
            They're built for pageviews, not for helping you score waves.
          </p>
          <p>
            So I built Howzit—the forecast app I actually wanted to use. Clean interface. No ads. Transparent ratings. 
            Real data from NOAA and open sources, interpreted specifically for each beach's orientation and conditions.
          </p>
          <p>
            The name? "Howzit" is Hawaiian surf slang—a casual greeting that means "how's it going?" 
            It felt right for an app that answers the eternal surfer question: <em>how's it looking out there?</em>
          </p>
        </div>
      </section>

      <!-- What Makes Us Different -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">What Makes Us Different</h2>
        
        <div class="grid sm:grid-cols-2 gap-6">
          <BrutalCard class="p-5">
            <h3 class="font-bold text-lg mb-2">🎯 Spot-Specific Ratings</h3>
            <p class="text-gray-600 text-sm">
              We know your beach faces ESE. We know NW wind is offshore for you. Our ratings account for this—not just raw buoy data.
            </p>
          </BrutalCard>
          
          <BrutalCard class="p-5">
            <h3 class="font-bold text-lg mb-2">🚫 Zero Ads, Zero Paywalls</h3>
            <p class="text-gray-600 text-sm">
              No pop-ups. No "premium" tier for basic features. The core forecast is free, forever.
            </p>
          </BrutalCard>
          
          <BrutalCard class="p-5">
            <h3 class="font-bold text-lg mb-2">📖 Open Book</h3>
            <p class="text-gray-600 text-sm">
              We explain exactly how our ratings work. No black box algorithms. Check our <NuxtLink to="/how-we-rate" class="underline font-medium">How We Rate</NuxtLink> page.
            </p>
          </BrutalCard>
          
          <BrutalCard class="p-5">
            <h3 class="font-bold text-lg mb-2">⚡ Fast & Clean</h3>
            <p class="text-gray-600 text-sm">
              Built for checking conditions from the parking lot. Loads fast, works on any device, gives you what you need instantly.
            </p>
          </BrutalCard>
        </div>
      </section>

      <!-- Coverage -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Current Coverage</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6">
          <p class="text-gray-700 mb-4">
            We cover the entire East Coast from Maine to Florida:
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <h4 class="font-bold">Maine</h4>
              <p class="text-sm text-gray-500">Southern Maine</p>
            </div>
            <div>
              <h4 class="font-bold">New Hampshire</h4>
              <p class="text-sm text-gray-500">Seacoast</p>
            </div>
            <div>
              <h4 class="font-bold">Massachusetts</h4>
              <p class="text-sm text-gray-500">Cape Cod & Nantucket</p>
            </div>
            <div>
              <h4 class="font-bold">Rhode Island</h4>
              <p class="text-sm text-gray-500">South County & Newport</p>
            </div>
            <div>
              <h4 class="font-bold">Connecticut</h4>
              <p class="text-sm text-gray-500">Fairfield to New London</p>
            </div>
            <div>
              <h4 class="font-bold">New York</h4>
              <p class="text-sm text-gray-500">Rockaways to Montauk</p>
            </div>
            <div>
              <h4 class="font-bold">New Jersey</h4>
              <p class="text-sm text-gray-500">Sandy Hook to LBI</p>
            </div>
            <div>
              <h4 class="font-bold">Delaware</h4>
              <p class="text-sm text-gray-500">Rehoboth to Fenwick</p>
            </div>
            <div>
              <h4 class="font-bold">Maryland</h4>
              <p class="text-sm text-gray-500">Ocean City & Assateague</p>
            </div>
            <div>
              <h4 class="font-bold">Virginia</h4>
              <p class="text-sm text-gray-500">Virginia Beach & more</p>
            </div>
            <div>
              <h4 class="font-bold">North Carolina</h4>
              <p class="text-sm text-gray-500">Outer Banks & beyond</p>
            </div>
            <div>
              <h4 class="font-bold">South Carolina</h4>
              <p class="text-sm text-gray-500">Grand Strand & Charleston</p>
            </div>
            <div>
              <h4 class="font-bold">Georgia</h4>
              <p class="text-sm text-gray-500">Tybee & Golden Isles</p>
            </div>
            <div>
              <h4 class="font-bold">Florida</h4>
              <p class="text-sm text-gray-500">Space Coast to Miami</p>
            </div>
          </div>
          <p class="text-gray-600 mt-4 text-sm">
            Have a spot request? <a href="mailto:howzitsurfing@gmail.com" class="underline">Let me know</a>.
          </p>
        </div>
      </section>

      <!-- The Tech -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">The Tech</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700">
          <p class="mb-4">For the nerds (like me), Howzit is built with:</p>
          <ul class="space-y-2 text-sm">
            <li><strong>Frontend:</strong> Nuxt.js, Vue 3, Tailwind CSS</li>
            <li><strong>Backend:</strong> Supabase (Postgres + Edge Functions)</li>
            <li><strong>Data:</strong> Open-Meteo Marine API, NOAA CO-OPS</li>
            <li><strong>AI:</strong> Claude by Anthropic for forecast summaries</li>
            <li><strong>Maps:</strong> Leaflet + OpenStreetMap</li>
          </ul>
          <p class="mt-4 text-sm">
            Updates run every 12 hours. Forecasts extend 7 days out. All open data sources—no scraping, no sketchy APIs.
          </p>
        </div>
      </section>

      <!-- Contact -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Get In Touch</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6">
          <p class="text-gray-700 mb-4">
            Got feedback? Found a bug? Want to request a spot? I'd love to hear from you.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a 
              href="mailto:howzitsurfing@gmail.com" 
              class="inline-flex items-center justify-center gap-2 bg-black text-white font-bold px-6 py-3 rounded-[6px] hover:bg-gray-800 transition-colors"
            >
              <span>📧</span> howzitsurfing@gmail.com
            </a>
            <a 
              href="https://instagram.com/howzitsurf" 
              target="_blank"
              class="inline-flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3 border-2 border-black rounded-[6px] hover:bg-gray-100 transition-colors"
            >
              <span>📸</span> @howzitsurf
            </a>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="text-center">
        <h2 class="text-2xl font-black uppercase mb-4">Ready to Check the Surf?</h2>
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
const siteUrl = 'https://howzitsurf.com'

useHead({
  title: 'About - Howzit',
  meta: [
    { name: 'description', content: 'Howzit is a surf forecast app built by an East Coast surfer. No ads, no paywalls, just clean forecasts with transparent ratings.' },
    { property: 'og:title', content: 'About - Howzit' },
    { property: 'og:description', content: 'Howzit is a surf forecast app built by an East Coast surfer. No ads, no paywalls, just clean forecasts.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/about` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/about` }
  ]
})
</script>
