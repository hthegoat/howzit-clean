<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-2xl mx-auto px-3 sm:px-6 py-16 sm:py-24">
      <div class="text-center mb-12">
        <h1 class="text-4xl sm:text-5xl font-black uppercase mb-4">Join the Waitlist</h1>
        <p class="text-lg text-gray-600">
          Be the first to know when we launch new features.<br>
          Early users get free access forever.
        </p>
      </div>

      <BrutalCard class="p-6 sm:p-8">
        <form action="https://formsubmit.co/howzitsurfing@gmail.com" method="POST" class="space-y-6">
          <input type="hidden" name="_subject" value="New Waitlist Signup!">
          <input type="hidden" name="_next" value="https://howzit.surf/spots">
          <input type="hidden" name="_captcha" value="false">
          
          <div>
            <label for="email" class="block text-sm font-bold uppercase mb-2">Email Address</label>
            <input 
              id="email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-3 border-2 border-black rounded-[6px] text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          <button 
            type="submit"
            class="w-full bg-yellow-400 text-black font-bold px-6 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            JOIN WAITLIST
          </button>
          
          <p class="text-xs text-gray-500 text-center">
            No spam, ever. Unsubscribe anytime.
          </p>
        </form>
      </BrutalCard>

      <!-- Teaser -->
      <div class="mt-12 text-center">
        <p class="text-sm text-gray-500 uppercase font-bold mb-4">Coming Soon</p>
        <div class="flex flex-wrap justify-center gap-3">
          <span class="bg-white px-3 py-1 border-2 border-black rounded-full text-sm font-medium">Push Alerts</span>
          <span class="bg-white px-3 py-1 border-2 border-black rounded-full text-sm font-medium">Saved Spots</span>
          <span class="bg-white px-3 py-1 border-2 border-black rounded-full text-sm font-medium">Session Tracker</span>
          <span class="bg-white px-3 py-1 border-2 border-black rounded-full text-sm font-medium">Community Reports</span>
        </div>
      </div>

      <!-- Founding Member Section -->
      <div class="mt-10 pt-8 border-t-2 border-black">
        <div class="text-center mb-8">
          <p class="text-sm text-gray-500 uppercase font-bold mb-2">Limited Offer</p>
          <h2 class="text-3xl sm:text-4xl font-black uppercase mb-3">Become a Founding Member</h2>
          <p class="text-gray-600">Lock in lifetime premium access. Only 100 spots available.</p>
        </div>

        <BrutalCard class="p-6 sm:p-8 border-black border-4 relative mt-6 overflow-visible">
          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <div class="flex items-baseline gap-2 mb-4">
                <span class="text-4xl font-black">$250</span>
                <span class="text-gray-500">one-time, lifetime</span>
              </div>
              
              <ul class="space-y-2">
                <li class="flex gap-2 text-sm">
                  <span class="text-green-600">✓</span>
                  <span><strong>Lifetime</strong> premium access</span>
                </li>
                <li class="flex gap-2 text-sm">
                  <span class="text-green-600">✓</span>
                  <span>All current & future features</span>
                </li>
                <li class="flex gap-2 text-sm">
                  <span class="text-green-600">✓</span>
                  <span>Push alerts & notifications</span>
                </li>
                <li class="flex gap-2 text-sm">
                  <span class="text-green-600">✓</span>
                  <span>Saved spots & session tracker</span>
                </li>
                <li class="flex gap-2 text-sm">
                  <span class="text-green-600">✓</span>
                  <span>Founding member badge</span>
                </li>
                <li class="flex gap-2 text-sm">
                  <span class="text-green-600">✓</span>
                  <span>Direct input on features</span>
                </li>
              </ul>
            </div>
            
            <div class="flex flex-col justify-center">
              <a 
                href="https://buy.stripe.com/bJe7sN0o9czv8lB02LbAs00"
                target="_blank"
                class="block w-full bg-yellow-400 text-black font-bold px-6 py-4 text-lg text-center border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                CLAIM YOUR SPOT
              </a>
              <p class="text-xs text-gray-500 text-center mt-3">Secure checkout via Stripe</p>
            </div>
          </div>
        </BrutalCard>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
useHead({
  title: 'Join the Waitlist - Howzit'
})
</script>
