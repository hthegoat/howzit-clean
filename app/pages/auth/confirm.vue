<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <BrutalCard class="max-w-md mx-auto p-8 text-center">
      <h1 class="text-2xl font-black uppercase mb-3">Email Confirmed!</h1>
      <p class="text-gray-600 mb-6">Your account is ready. You're all set to start tracking swells.</p>
      <NuxtLink 
        to="/spots"
        class="inline-block bg-yellow-400 text-black font-bold px-6 py-3 border-2 border-black rounded-[6px] shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        VIEW FORECASTS
      </NuxtLink>
    </BrutalCard>
  </div>
</template>

<script setup>
// This page is the redirect target after clicking email confirmation link.
// @nuxtjs/supabase handles the token exchange automatically.

const user = useSupabaseUser()

// If they're logged in, they can navigate away. If not, the card still works.
useHead({
  title: 'Email Confirmed - Howzit'
})
</script>
