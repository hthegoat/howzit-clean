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
            to="/login" 
            class="bg-white text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            CREATE ACCOUNT
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
            <p class="text-gray-600">Direct from NOAA buoys, ECMWF, and Open-Meteo models. We show you what's actually happening, not what gets clicks.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">🎯</div>
            <h3 class="text-xl font-bold mb-2">Smart Ratings</h3>
            <p class="text-gray-600">Our algorithm factors in swell direction, period, wind, and your beach's orientation. Not just wave height.</p>
          </BrutalCard>
          
          <BrutalCard class="p-6">
            <div class="text-4xl mb-4">🚫</div>
            <h3 class="text-xl font-bold mb-2">Zero Ads, Zero Paywalls</h3>
            <p class="text-gray-600">No pop-ups. No video ads. No paywalls. Every feature is free, forever.</p>
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
            <h3 class="text-xl font-bold mb-2">137 Spots, 17 States</h3>
            <p class="text-gray-600">Maine to Hawaii. Every major break from the Northeast to SoCal. Request yours and we'll add it.</p>
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
        <p class="text-lg text-gray-600 mb-8">Free forever. No credit card. No paywall. No catch.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink 
            to="/spots" 
            class="bg-yellow-400 text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            VIEW ALL SPOTS →
          </NuxtLink>
          <NuxtLink 
            to="/login" 
            class="bg-white text-black font-bold px-6 sm:px-8 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            CREATE ACCOUNT
          </NuxtLink>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<script setup>
const siteUrl = 'https://hwztsurf.com'

// JSON-LD structured data for homepage
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Howzit',
  url: siteUrl,
  logo: `${siteUrl}/favicon.svg`,
  description: 'Free surf forecasts for the US. Real-time wave heights, tides, wind, and multi-model blending with confidence indicators. 137 spots across 17 states.',
  foundingDate: '2025',
  sameAs: []
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Howzit',
  url: siteUrl,
  description: 'Surf forecasts with multi-model blending. No ads, no bloat—just accurate wave heights, tides, wind, and AI-powered summaries for 137 spots across 17 states.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/spots?search={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Howzit',
    url: siteUrl
  }
}

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Howzit - Surf Forecasts That Don\'t Suck',
  description: 'Free surf reports for 137 spots across 17 states. No ads, no paywall—just wave heights, tides, wind, and AI-powered forecasts.',
  url: siteUrl,
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'Howzit',
    applicationCategory: 'WeatherApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      }
    ]
  }
}

useHead({
  title: 'Howzit - Surf Forecasts That Don\'t Suck',
  meta: [
    { name: 'description', content: 'Free surf reports for 137 spots across 17 states. No ads, no paywall—just wave heights, tides, wind, and AI-powered forecasts.' },
    { property: 'og:title', content: 'Howzit - Surf Forecasts That Don\'t Suck' },
    { property: 'og:description', content: 'Free surf reports for 137 spots across 17 states. No ads, no paywall—just the data you need to score waves.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: siteUrl },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Howzit - Surf Forecasts That Don\'t Suck' },
    { name: 'twitter:description', content: 'Free surf reports for 137 spots across 17 states. No ads, no paywall—just the data you need to score waves.' },
  ],
  link: [
    { rel: 'canonical', href: siteUrl }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organizationSchema)
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(webSiteSchema)
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(webPageSchema)
    }
  ]
})
</script>
