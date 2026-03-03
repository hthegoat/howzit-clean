<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-4">Terms of Service</h1>
        <p class="text-lg text-gray-600">
          Last updated: {{ lastUpdated }}
        </p>
      </div>

      <!-- Intro -->
      <section class="mb-10">
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 space-y-4">
          <p>
            These terms govern your use of Howzit (hwztsurf.com), operated by Harrison ("we", "us", "our"). 
            By using Howzit, you agree to these terms. If you don't agree, please don't use the service.
          </p>
          <p>
            We've tried to keep this readable and fair. No legalese traps.
          </p>
        </div>
      </section>

      <!-- The Service -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">The Service</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>
            Howzit provides surf forecasts, wave data, tide information, and related content for surfing 
            locations across the United States. Our forecasts are generated from publicly 
            available data sources including NOAA, Open-Meteo, ECMWF, and WaveWatch III.
          </p>
          <p>
            We strive for accuracy, but ocean conditions are inherently unpredictable. Howzit is a 
            forecasting tool—not a guarantee. Always use your own judgment when entering the water.
          </p>
        </div>
      </section>

      <!-- Disclaimer -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Important Disclaimer</h2>
        
        <div class="bg-yellow-50 border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p class="font-bold">
            Surf forecasts are predictions, not promises.
          </p>
          <p>
            Howzit's forecasts, ratings, and surf condition reports are provided for informational purposes only. 
            Ocean conditions can change rapidly and may differ from any forecast. We are not responsible for any 
            decisions you make based on our data.
          </p>
          <p>
            <strong>Surfing is inherently dangerous.</strong> You assume all risk when entering the ocean. Always 
            assess conditions with your own eyes, surf within your ability, and follow local safety guidelines.
          </p>
          <p>
            We do not guarantee the accuracy, completeness, or timeliness of any forecast data. Our upstream 
            data providers (NOAA, Open-Meteo, etc.) may experience outages or errors outside our control.
          </p>
        </div>
      </section>

      <!-- Accounts -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Accounts</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>
            Some features may require you to create an account. You're responsible for keeping your login 
            credentials secure and for all activity under your account.
          </p>
          <p>
            You must provide accurate information when creating an account. We reserve the right to suspend 
            or terminate accounts that violate these terms.
          </p>
        </div>
      </section>

      <!-- Acceptable Use -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Acceptable Use</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>You agree not to:</p>
          <p>Scrape, crawl, or automatically extract data from Howzit without permission.</p>
          <p>Attempt to access other users' accounts or private data.</p>
          <p>Use the service to distribute spam, malware, or harmful content.</p>
          <p>Resell or redistribute Howzit's forecast data commercially without permission.</p>
          <p>Interfere with or disrupt the service or its infrastructure.</p>
        </div>
      </section>

      <!-- Intellectual Property -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Intellectual Property</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>
            The Howzit name, logo, design, and original content (including AI-generated surf summaries, 
            rating algorithms, and spot-specific insights) are our intellectual property.
          </p>
          <p>
            The underlying forecast data comes from public government sources (NOAA, ECMWF) and open APIs 
            (Open-Meteo). We don't claim ownership of raw public data.
          </p>
        </div>
      </section>

      <!-- Limitation of Liability -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Limitation of Liability</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>
            Howzit is provided "as is" without warranties of any kind, express or implied. We don't warrant 
            that the service will be uninterrupted, error-free, or that forecasts will be accurate.
          </p>
          <p>
            To the fullest extent permitted by law, Howzit and its operator shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages arising from your use of the 
            service, including but not limited to personal injury, property damage, or decisions made based 
            on forecast data.
          </p>
        </div>
      </section>

      <!-- Changes -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Changes to These Terms</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm">
          <p>
            We may update these terms from time to time. If we make significant changes, we'll notify you 
            through the site. Continued use of Howzit after changes constitutes acceptance of the updated terms.
          </p>
        </div>
      </section>

      <!-- Governing Law -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Governing Law</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm">
          <p>
            These terms are governed by the laws of the State of New Jersey, United States. Any disputes 
            will be resolved in the courts of New Jersey.
          </p>
        </div>
      </section>

      <!-- Contact -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Contact</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm">
          <p>
            Questions about these terms? Reach out at 
            <a href="mailto:howzitsurfing@gmail.com" class="underline font-medium">howzitsurfing@gmail.com</a>.
          </p>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const siteUrl = 'https://www.hwztsurf.com'
const lastUpdated = 'February 19, 2026'

useHead({
  title: 'Terms of Service - Howzit',
  meta: [
    { name: 'description', content: 'Howzit\'s terms of service. Fair terms, no legalese traps.' },
    { property: 'og:title', content: 'Terms of Service - Howzit' },
    { property: 'og:description', content: 'Howzit\'s terms of service. Fair terms, no legalese traps.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/terms` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/terms` }
  ]
})
</script>
