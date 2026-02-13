<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-4">Open Stats</h1>
        <p class="text-body text-gray-600">
          Real numbers from a real indie project. No vanity metrics, no BS.
          This is exactly where Howzit stands right now.
        </p>
      </div>

      <div v-if="pending" class="text-center py-20 text-gray-400 font-bold uppercase">Loading stats...</div>

      <div v-else-if="stats">

        <!-- Early Access -->
        <section class="mb-12">
          <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">🏄 Early Access</h2>
          
          <BrutalCard accent-color="#facc15" class="p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p class="text-card-title">$10/year — first 1,000 members only</p>
                <p class="text-meta">Lock in early access pricing before it goes up.</p>
              </div>
              <div class="text-left sm:text-right">
                <span class="text-4xl sm:text-5xl font-black text-yellow-500">{{ stats.proSlotsRemaining }}</span>
                <span class="text-section ml-1">slots left</span>
              </div>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-4 border-2 border-black overflow-hidden">
              <div 
                class="bg-yellow-400 h-full rounded-full transition-all duration-500"
                :style="{ width: Math.max(1, ((1000 - stats.proSlotsRemaining) / 1000) * 100) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-meta mt-2">
              <span>{{ 1000 - stats.proSlotsRemaining }} claimed</span>
              <span>1,000 total</span>
            </div>
          </BrutalCard>
        </section>

        <!-- Members -->
        <section class="mb-12">
          <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">💰 Members</h2>
          
          <div class="grid grid-cols-3 gap-4">
            <BrutalCard class="p-5 text-center">
              <p class="text-3xl sm:text-4xl font-black">{{ stats.users }}</p>
              <p class="text-section mt-2">Users</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-3xl sm:text-4xl font-black">{{ stats.proMembers }}</p>
              <p class="text-section mt-2">Pro</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-3xl sm:text-4xl font-black">{{ stats.foundingMembers }}</p>
              <p class="text-section mt-2">Founding</p>
            </BrutalCard>
          </div>
        </section>

        <!-- Coverage -->
        <section class="mb-12">
          <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">🏖️ Coverage</h2>
          
          <div class="grid grid-cols-3 gap-4">
            <BrutalCard class="p-5 text-center">
              <p class="text-3xl sm:text-4xl font-black">{{ stats.spots }}</p>
              <p class="text-section mt-2">Surf Spots</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-3xl sm:text-4xl font-black">{{ stats.states }}</p>
              <p class="text-section mt-2">States</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-3xl sm:text-4xl font-black">{{ formatNumber(stats.summaries) }}</p>
              <p class="text-section mt-2">AI Summaries</p>
            </BrutalCard>
          </div>
        </section>

        <!-- Data Pipeline -->
        <section class="mb-12">
          <h2 class="text-2xl font-black uppercase mb-6 pb-2 border-b-2 border-black">📡 Data Pipeline</h2>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <BrutalCard class="p-5 text-center">
              <p class="text-2xl sm:text-3xl font-black font-mono">{{ formatNumber(stats.forecasts) }}</p>
              <p class="text-section mt-2">Forecasts</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-2xl sm:text-3xl font-black font-mono">{{ formatNumber(stats.buoyReadings) }}</p>
              <p class="text-section mt-2">Buoy Reads</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-2xl sm:text-3xl font-black font-mono">{{ formatNumber(stats.tides) }}</p>
              <p class="text-section mt-2">Tide Records</p>
            </BrutalCard>
            <BrutalCard class="p-5 text-center">
              <p class="text-2xl sm:text-3xl font-black">3</p>
              <p class="text-section mt-2">Models</p>
            </BrutalCard>
          </div>

          <!-- Pipeline health -->
          <div class="bg-white border-2 border-black rounded-lg p-4 space-y-2">
            <p class="text-section mb-3">System Health</p>
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="isRecent(stats.lastForecastUpdate, 6) ? 'bg-emerald-500' : 'bg-red-500'"></span>
              <span class="text-body text-sm">Forecasts</span>
              <span class="text-meta ml-auto">{{ timeAgo(stats.lastForecastUpdate) }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="isRecent(stats.lastBuoyUpdate, 2) ? 'bg-emerald-500' : 'bg-red-500'"></span>
              <span class="text-body text-sm">Buoy data</span>
              <span class="text-meta ml-auto">{{ timeAgo(stats.lastBuoyUpdate) }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="isRecent(stats.lastSummaryUpdate, 12) ? 'bg-emerald-500' : 'bg-red-500'"></span>
              <span class="text-body text-sm">AI summaries</span>
              <span class="text-meta ml-auto">{{ timeAgo(stats.lastSummaryUpdate) }}</span>
            </div>
          </div>
        </section>

        <!-- The Mission -->
        <section class="mb-12">
          <div class="bg-black text-white border-2 border-black rounded-lg sm:shadow-[4px_4px_0px_#facc15] p-6 sm:p-10 text-center">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400 mb-4">The Mission</p>
            <p class="text-xl sm:text-2xl font-black mb-4 leading-tight">
              Build a transparent, independent surf forecast that surfers actually trust.
            </p>
            <p class="text-sm text-gray-400 max-w-md mx-auto mb-8">
              No VC money. No ads. No black box algorithms. Just open data, 
              honest ratings, and a dude who got tired of guessing if Surfline was right.
            </p>
            <NuxtLink 
              to="/pricing" 
              class="inline-block bg-yellow-400 text-black font-bold px-8 py-3 text-sm rounded-lg border-2 border-black hover:bg-yellow-300 transition-colors uppercase"
            >
              Support the Project — $10/year
            </NuxtLink>
          </div>
        </section>

      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
const { data: stats, pending } = await useFetch('/api/open-stats', {
  lazy: true
})

const formatNumber = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

const timeAgo = (dateStr) => {
  if (!dateStr) return 'N/A'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const isRecent = (dateStr, maxHours) => {
  if (!dateStr) return false
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff < maxHours * 60 * 60 * 1000
}

useHead({
  title: 'Open Stats - Howzit',
  meta: [
    { name: 'description', content: 'Howzit is an open indie project. See our real stats — users, revenue, data pipeline health, and coverage.' },
    { property: 'og:title', content: 'Open Stats - Howzit' },
    { property: 'og:description', content: 'Real numbers from a real indie surf forecast. No vanity metrics.' },
  ]
})
</script>
