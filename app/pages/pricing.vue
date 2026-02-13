<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <!-- Header -->
      <div class="text-center mb-10 sm:mb-14">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-3">Go Pro</h1>
        <p class="text-gray-600 max-w-lg mx-auto">
          Extended forecasts with multi-model confidence scoring. Plan your sessions, not just your morning.
        </p>
      </div>

      <!-- Cards -->
      <div class="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-sm md:max-w-none mx-auto">
        
        <!-- Free -->
        <div class="bg-white border-2 border-black rounded-[6px] p-5 sm:p-6 flex flex-col">
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Free</p>
          <p class="text-3xl font-black mb-4">$0</p>
          <p class="text-sm text-gray-500 mb-6">Quick forecast check for any spot.</p>
          
          <div class="space-y-2.5 flex-1">
            <PricingFeature>4-day surf forecast</PricingFeature>
            <PricingFeature>All 76 East Coast spots</PricingFeature>
            <PricingFeature>Live buoy data & tides</PricingFeature>
            <PricingFeature>Howzit surf ratings</PricingFeature>
            <PricingFeature>AI daily summaries</PricingFeature>
          </div>

          <NuxtLink
            v-if="!isLoggedIn"
            to="/login"
            class="mt-8 block w-full text-center font-bold text-sm px-4 py-3 border-2 border-black rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            SIGN UP FREE
          </NuxtLink>
          <div
            v-else
            class="mt-8 block w-full text-center text-gray-400 font-bold text-sm px-4 py-3 border-2 border-gray-200 rounded-[6px] cursor-default"
          >
            ✓ CURRENT PLAN
          </div>
        </div>

        <!-- Pro -->
        <div class="bg-white border-[3px] border-black rounded-[6px] p-5 sm:p-6 flex flex-col relative sm:shadow-[4px_4px_0px_#000] order-first md:order-none">
          <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black uppercase px-3 py-0.5 border-2 border-black rounded-full whitespace-nowrap">
            Early Access · $10/yr
          </span>
          
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Pro</p>
          <p class="text-3xl font-black mb-1">$10</p>
          <p class="text-xs text-yellow-600 font-semibold mb-4">per year · locked in for first 1,000 members</p>
          <p class="text-sm text-gray-500 mb-6">Plan trips and track swells with confidence.</p>
          
          <div class="space-y-2.5 flex-1">
            <PricingFeature>Everything in Free</PricingFeature>
            <PricingFeature bold>Full 7-day forecast</PricingFeature>
            <PricingFeature bold>3-model confidence scoring</PricingFeature>
            <PricingFeature>Model comparison tools</PricingFeature>
            <PricingFeature soon>Push alerts</PricingFeature>
            <PricingFeature soon>Session tracking</PricingFeature>
          </div>

          <button
            v-if="!isLoggedIn"
            @click="navigateTo('/login')"
            class="mt-8 block w-full text-center bg-yellow-400 text-black font-bold text-sm px-4 py-3 border-2 border-black rounded-[6px] hover:bg-yellow-300 transition-colors"
          >
            GO PRO
          </button>
          <button
            v-else-if="isProUser || isFoundingMember"
            disabled
            class="mt-8 block w-full text-center bg-green-50 text-green-700 font-bold text-sm px-4 py-3 border-2 border-green-200 rounded-[6px] cursor-default"
          >
            🤙 YOU'RE PRO
          </button>
          <button
            v-else
            @click="handleCheckout"
            :disabled="checkoutLoading"
            class="mt-8 block w-full text-center bg-yellow-400 text-black font-bold text-sm px-4 py-3 border-2 border-black rounded-[6px] hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {{ checkoutLoading ? 'LOADING...' : 'GO PRO' }}
          </button>
          
          <p v-if="checkoutError" class="text-xs text-red-600 text-center mt-2">{{ checkoutError }}</p>
        </div>

        <!-- Founding -->
        <div class="bg-white border-2 border-black rounded-[6px] p-5 sm:p-6 flex flex-col">
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Founding Member</p>
          <p class="text-3xl font-black mb-1">$99</p>
          <p class="text-xs text-yellow-600 font-semibold mb-4">One-time · lifetime access</p>
          <p class="text-sm text-gray-500 mb-6">Support independent surf forecasting forever.</p>
          
          <div class="space-y-2.5 flex-1">
            <PricingFeature star>Everything in Pro, forever</PricingFeature>
            <PricingFeature star>All future features included</PricingFeature>
            <PricingFeature star>Founding member badge</PricingFeature>
            <PricingFeature star>Direct input on roadmap</PricingFeature>
            <PricingFeature star>Never pay again</PricingFeature>
          </div>

          <button
            v-if="!isLoggedIn"
            @click="navigateTo('/login')"
            class="mt-8 block w-full text-center font-bold text-sm px-4 py-3 border-2 border-black rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            GO PRO — LIFETIME
          </button>
          <button
            v-else
            @click="handleFoundingCheckout"
            :disabled="foundingLoading"
            class="mt-8 block w-full text-center font-bold text-sm px-4 py-3 border-2 border-black rounded-[6px] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {{ foundingLoading ? 'LOADING...' : 'GO PRO — LIFETIME' }}
          </button>
          <p class="text-[11px] text-gray-400 text-center mt-2">Limited to 100 founding members</p>
        </div>
      </div>

      <!-- FAQ -->
      <div class="mt-14 sm:mt-20 max-w-2xl mx-auto">
        <h2 class="text-xl sm:text-2xl font-black uppercase mb-6 text-center">Questions</h2>
        
        <div class="space-y-3">
          <details v-for="faq in faqs" :key="faq.q" class="group bg-white border-2 border-black rounded-[6px] overflow-hidden">
            <summary class="flex justify-between items-center cursor-pointer px-4 py-3 font-bold text-sm select-none">
              {{ faq.q }}
              <span class="text-gray-400 group-open:rotate-45 transition-transform text-lg leading-none ml-2">+</span>
            </summary>
            <p class="px-4 pb-4 text-sm text-gray-600 -mt-1">{{ faq.a }}</p>
          </details>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
const { isLoggedIn, isProUser, isFoundingMember } = useAuth()

const checkoutLoading = ref(false)
const checkoutError = ref('')
const foundingLoading = ref(false)

const faqs = [
  {
    q: 'What do I get with the free plan?',
    a: 'Full access to all 76 spots with 4-day forecasts, live buoy data, tide charts, surf ratings, and AI summaries. No credit card required.'
  },
  {
    q: 'How is the forecast generated?',
    a: 'We blend data from three models: Open-Meteo, ECMWF, and WaveWatch III. Each forecast includes a confidence score based on how well the models agree. More models = more trust.'
  },
  {
    q: 'What happens after the first 1,000 members?',
    a: 'Early access pricing is locked in at $10/year for our first 1,000 members. After that, the price goes up. If you sign up now, you keep the $10/year rate as long as you stay subscribed.'
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime and keep Pro access until the end of your billing period. No contracts, no hassle.'
  },
  {
    q: 'How is this different from Surfline?',
    a: 'We show you exactly where our forecasts come from — multiple open-source models with confidence scores. No black box. No ads. Think of us as your second opinion.'
  }
]

const handleCheckout = async () => {
  checkoutLoading.value = true
  checkoutError.value = ''

  try {
    const { url } = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: { plan: 'yearly' }
    })

    if (url) {
      window.location.href = url
    }
  } catch (e) {
    checkoutError.value = e?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    checkoutLoading.value = false
  }
}

const handleFoundingCheckout = async () => {
  foundingLoading.value = true
  checkoutError.value = ''

  try {
    const { url } = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: { plan: 'founding' }
    })

    if (url) {
      window.location.href = url
    }
  } catch (e) {
    checkoutError.value = e?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    foundingLoading.value = false
  }
}

useHead({
  title: 'Pricing - Howzit',
  meta: [
    { name: 'description', content: 'Howzit Pro: 7-day surf forecasts, multi-model confidence scoring, and more. Just $10/year for early members.' },
    { property: 'og:title', content: 'Go Pro - Howzit' },
    { property: 'og:description', content: '7-day surf forecasts for $10/year. Early access pricing for the first 1,000 members.' },
  ]
})
</script>
