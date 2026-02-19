<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-4">Privacy Policy</h1>
        <p class="text-lg text-gray-600">
          Last updated: {{ lastUpdated }}
        </p>
      </div>

      <!-- Intro -->
      <section class="mb-10">
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 space-y-4">
          <p>
            Howzit ("we", "us", "our") is a surf forecast platform built by an independent developer. 
            We believe in transparency—not just with wave data, but with how we handle your information.
          </p>
          <p>
            This policy explains what we collect, why, and what we do with it. The short version: 
            <strong>we collect as little as possible and never sell your data.</strong>
          </p>
        </div>
      </section>

      <!-- What We Collect -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">What We Collect</h2>
        
        <div class="space-y-6">
          <div class="bg-white border-2 border-black rounded-lg p-6">
            <h3 class="font-bold text-lg mb-3">Account Information</h3>
            <p class="text-gray-700 text-sm">
              If you create an account, we collect your email address and any profile information you choose to provide. 
              Authentication is handled through Supabase, which stores your credentials securely.
            </p>
          </div>

          <div class="bg-white border-2 border-black rounded-lg p-6">
            <h3 class="font-bold text-lg mb-3">Waitlist & Email Signups</h3>
            <p class="text-gray-700 text-sm">
              If you join our waitlist or sign up for updates, we store your email address to send you product news 
              and launch updates. You can unsubscribe at any time by emailing us.
            </p>
          </div>

          <div class="bg-white border-2 border-black rounded-lg p-6">
            <h3 class="font-bold text-lg mb-3">Usage Data</h3>
            <p class="text-gray-700 text-sm">
              We use basic analytics to understand how people use Howzit—things like which pages are visited, 
              which spots are popular, and general traffic patterns. We do not track you across the web or build 
              advertising profiles.
            </p>
          </div>

          <div class="bg-white border-2 border-black rounded-lg p-6">
            <h3 class="font-bold text-lg mb-3">Payment Information</h3>
            <p class="text-gray-700 text-sm">
              If you purchase a founding membership or premium features, payments are processed through Stripe. 
              We never see or store your full credit card number. Stripe handles all payment data under their own 
              <a href="https://stripe.com/privacy" target="_blank" class="underline font-medium">privacy policy</a>.
            </p>
          </div>
        </div>
      </section>

      <!-- What We Don't Collect -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">What We Don't Collect</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 space-y-3 text-sm">
          <p>We don't collect precise GPS location data without your explicit permission.</p>
          <p>We don't sell, rent, or share your personal data with advertisers.</p>
          <p>We don't use third-party ad trackers or retargeting pixels.</p>
          <p>We don't build behavioral profiles for marketing purposes.</p>
        </div>
      </section>

      <!-- How We Use Your Data -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">How We Use Your Data</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 space-y-3 text-sm">
          <p><strong>To provide the service:</strong> Delivering forecasts, managing your account, and processing payments.</p>
          <p><strong>To improve Howzit:</strong> Understanding which features are used helps us build a better product.</p>
          <p><strong>To communicate with you:</strong> Sending product updates, responding to support requests, and notifying you about changes to the service.</p>
        </div>
      </section>

      <!-- Third-Party Services -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Third-Party Services</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>Howzit relies on the following third-party services, each with their own privacy policies:</p>
          <p><strong>Supabase</strong> — Database and authentication (<a href="https://supabase.com/privacy" target="_blank" class="underline">privacy policy</a>)</p>
          <p><strong>Stripe</strong> — Payment processing (<a href="https://stripe.com/privacy" target="_blank" class="underline">privacy policy</a>)</p>
          <p><strong>Vercel</strong> — Hosting and deployment (<a href="https://vercel.com/legal/privacy-policy" target="_blank" class="underline">privacy policy</a>)</p>
          <p>Our forecast data comes from public sources (NOAA, Open-Meteo, ECMWF) and does not involve any user data.</p>
        </div>
      </section>

      <!-- Cookies -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Cookies</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>
            We use essential cookies to keep you logged in and maintain your session. We do not use 
            advertising cookies or third-party tracking cookies.
          </p>
          <p>
            If we add analytics in the future, we'll use privacy-respecting tools and update this policy accordingly.
          </p>
        </div>
      </section>

      <!-- Data Retention -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Data Retention & Deletion</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm space-y-3">
          <p>
            We retain your account data for as long as your account is active. If you want to delete your account 
            and all associated data, email us at 
            <a href="mailto:howzitsurfing@gmail.com" class="underline font-medium">howzitsurfing@gmail.com</a> 
            and we'll take care of it within 30 days.
          </p>
          <p>
            Waitlist emails are retained until you unsubscribe or request deletion.
          </p>
        </div>
      </section>

      <!-- Children -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Children's Privacy</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm">
          <p>
            Howzit is not directed at children under 13. We do not knowingly collect personal information from 
            children under 13. If you believe we have collected such information, please contact us and we will 
            promptly delete it.
          </p>
        </div>
      </section>

      <!-- Changes -->
      <section class="mb-10">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Changes to This Policy</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm">
          <p>
            We may update this privacy policy from time to time. If we make significant changes, we'll notify 
            you through the site or via email. The "last updated" date at the top of this page will always 
            reflect the most recent version.
          </p>
        </div>
      </section>

      <!-- Contact -->
      <section class="mb-12">
        <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">Contact</h2>
        
        <div class="bg-white border-2 border-black rounded-lg p-6 text-gray-700 text-sm">
          <p>
            Questions about this policy? Reach out at 
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
  title: 'Privacy Policy - Howzit',
  meta: [
    { name: 'description', content: 'Howzit\'s privacy policy. We collect as little as possible and never sell your data.' },
    { property: 'og:title', content: 'Privacy Policy - Howzit' },
    { property: 'og:description', content: 'Howzit\'s privacy policy. We collect as little as possible and never sell your data.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/privacy` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/privacy` }
  ]
})
</script>
