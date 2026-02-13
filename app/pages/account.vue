<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 class="text-3xl sm:text-4xl font-black uppercase mb-8">Your Account</h1>

      <div v-if="!isLoggedIn" class="text-center py-12">
        <p class="text-gray-600 mb-4">Sign in to manage your spots and account.</p>
        <NuxtLink 
          to="/login"
          class="inline-block bg-yellow-400 text-black font-bold px-6 py-3 border-2 border-black rounded-[6px] hover:bg-yellow-300 transition-colors"
        >
          SIGN IN
        </NuxtLink>
      </div>

      <div v-else class="space-y-6">
        <!-- My Spots -->
        <div class="bg-white border-2 border-black rounded-[6px] overflow-hidden">
          <div class="flex justify-between items-center px-5 py-3 border-b-2 border-black">
            <h2 class="font-black uppercase text-sm">My Spots</h2>
            <span class="text-xs text-gray-400 font-mono">{{ mySpots.length }} following</span>
          </div>

          <div v-if="spotsLoading" class="p-8 text-center text-gray-400 text-sm">
            Loading your spots...
          </div>
          
          <div v-else-if="mySpots.length === 0" class="p-8 text-center">
            <p class="text-gray-500 mb-1">No spots followed yet</p>
            <p class="text-sm text-gray-400 mb-4">Star spots from any forecast page to see them here.</p>
            <NuxtLink 
              to="/spots"
              class="inline-block text-sm font-bold px-4 py-2 border-2 border-black rounded-[6px] hover:bg-gray-50 transition-colors"
            >
              BROWSE SPOTS
            </NuxtLink>
          </div>

          <div v-else class="divide-y divide-gray-100">
            <NuxtLink
              v-for="spot in mySpotsWithConditions"
              :key="spot.spotId"
              :to="`/spots/${spot.slug}`"
              class="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm group-hover:underline truncate">{{ spot.name }}</p>
                <p class="text-xs text-gray-400">{{ spot.region }}, {{ spot.state }}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-3">
                <div v-if="spot.conditions" class="text-right">
                  <p class="font-mono font-bold text-sm">{{ spot.conditions.height }}</p>
                  <p class="text-[11px] text-gray-400">{{ spot.conditions.period }}s {{ spot.conditions.wind }}mph</p>
                </div>
                <div 
                  class="w-2 h-8 rounded-full" 
                  :class="spot.conditions ? ratingColor(spot.conditions.rating) : 'bg-gray-200'"
                ></div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Account Info -->
        <div class="bg-white border-2 border-black rounded-[6px] p-5">
          <h2 class="font-black uppercase text-sm mb-4">Account</h2>
          <div class="space-y-2.5">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase text-gray-400">Email</span>
              <span class="text-sm font-mono">{{ userEmail }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase text-gray-400">Plan</span>
              <span class="text-sm font-bold" :class="tierColor">{{ tierLabel }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase text-gray-400">Member Since</span>
              <span class="text-sm font-mono">{{ memberSince }}</span>
            </div>
          </div>
        </div>

        <!-- Upgrade CTA -->
        <div v-if="!isProUser" class="bg-white border-[3px] border-black rounded-[6px] p-5">
          <p class="font-black mb-1">Unlock Extended Forecasts</p>
          <p class="text-sm text-gray-500 mb-4">Full 7-day forecasts with multi-model confidence scoring.</p>
          <NuxtLink 
            to="/pricing"
            class="inline-block bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 border-2 border-black rounded-[6px] hover:bg-yellow-300 transition-colors"
          >
            UPGRADE TO PRO
          </NuxtLink>
        </div>

        <!-- Pro badge -->
        <div v-else class="bg-green-50 border-2 border-green-200 rounded-[6px] p-5 flex items-center gap-3">
          <span class="text-2xl">🤙</span>
          <div>
            <p class="font-black text-sm">{{ isFoundingMember ? 'Founding Member' : 'Pro Member' }}</p>
            <p class="text-xs text-gray-500">Full access to all features.</p>
          </div>
        </div>

        <!-- Sign Out -->
        <button
          @click="handleSignOut"
          class="text-sm text-gray-400 hover:text-black font-medium underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { user, isLoggedIn, isProUser, isFoundingMember, tier, profile } = useAuth()
const { mySpots, loading: spotsLoading } = useMySpots()
const { signOut } = useAuth()

// Get userId/email safely
const userEmail = computed(() => user.value?.email || '')

// Fetch current conditions for followed spots
const mySpotsWithConditions = ref([])

const { calculateRating } = useHowzitRating()

const fetchSpotConditions = async () => {
  if (!mySpots.value.length) {
    mySpotsWithConditions.value = []
    return
  }

  const now = new Date().toISOString()
  const spotIds = mySpots.value.map(s => s.spotId)

  // Get the latest forecast for each followed spot
  const results = await Promise.all(
    mySpots.value.map(async (spot) => {
      const { data } = await supabase
        .from('forecasts')
        .select('blended_wave_height, wave_height, wave_period, swell_wave_period, wind_speed, swell_wave_height, swell_wave_direction, wind_wave_height, wind_wave_direction, wind_direction')
        .eq('spot_id', spot.spotId)
        .gte('timestamp', now)
        .order('timestamp', { ascending: true })
        .limit(1)
        .single()

      let conditions = null
      if (data) {
        const h = data.blended_wave_height ?? data.wave_height
        const heightFt = h ? Math.round(h * 3.281) : 0
        const period = Math.round(data.swell_wave_period || data.wave_period || 0)
        const windMph = data.wind_speed ? Math.round(data.wind_speed * 0.621) : 0
        
        const rating = calculateRating({
          waveHeight: h,
          wavePeriod: data.wave_period,
          swellWaveHeight: data.swell_wave_height,
          swellWavePeriod: data.swell_wave_period,
          swellWaveDirection: data.swell_wave_direction,
          windWaveHeight: data.wind_wave_height,
          windWaveDirection: data.wind_wave_direction,
          windSpeed: data.wind_speed,
          windDirection: data.wind_direction,
          beachOrientation: 90
        })

        conditions = {
          height: heightFt > 0 ? `${Math.max(1, heightFt - 1)}-${heightFt + 1}ft` : 'Flat',
          period,
          wind: windMph,
          rating
        }
      }

      return { ...spot, conditions }
    })
  )

  mySpotsWithConditions.value = results
}

const ratingColor = (score) => {
  if (score >= 55) return 'bg-emerald-500'
  if (score >= 35) return 'bg-blue-500'
  if (score >= 10) return 'bg-rose-400'
  return 'bg-gray-300'
}

// Watch for spot changes and fetch conditions
watch(mySpots, () => {
  fetchSpotConditions()
}, { immediate: true })

const tierLabel = computed(() => {
  if (tier.value === 'founding') return 'Founding Member'
  if (tier.value === 'pro') return 'Pro'
  return 'Free'
})

const tierColor = computed(() => {
  if (tier.value === 'founding') return 'text-yellow-600'
  if (tier.value === 'pro') return 'text-green-600'
  return 'text-gray-600'
})

const memberSince = computed(() => {
  if (!profile.value?.created_at) return '--'
  return new Date(profile.value.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
})

const handleSignOut = async () => {
  await signOut()
}

useHead({
  title: 'Account - Howzit',
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
</script>
