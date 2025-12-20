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
        <form v-if="!submitted" @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-bold uppercase mb-2">Email Address</label>
            <input 
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-3 border-2 border-black rounded-[6px] text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-yellow-400 text-black font-bold px-6 py-4 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'JOINING...' : 'JOIN WAITLIST' }}
          </button>
          
          <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
          
          <p class="text-xs text-gray-500 text-center">
            No spam, ever. Unsubscribe anytime.
          </p>
        </form>

        <div v-else class="text-center py-8">
          <div class="text-5xl mb-4">🤙</div>
          <h2 class="text-2xl font-bold mb-2">You're on the list!</h2>
          <p class="text-gray-600 mb-6">We'll hit you up when there's something worth sharing.</p>
          <NuxtLink 
            to="/spots"
            class="inline-block bg-white text-black font-bold px-6 py-3 border-2 border-black rounded-[6px] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            CHECK THE FORECAST →
          </NuxtLink>
        </div>
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
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const supabase = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const submitted = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!email.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ email: email.value.toLowerCase().trim() })
    
    if (dbError) {
      if (dbError.code === '23505') {
        // Unique constraint - already signed up
        submitted.value = true
      } else {
        throw dbError
      }
    } else {
      submitted.value = true
    }
  } catch (err) {
    console.error('Waitlist error:', err)
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Join the Waitlist - Howzit'
})
</script>
