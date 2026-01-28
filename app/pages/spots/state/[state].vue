<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <!-- State Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <NuxtLink to="/spots" class="hover:text-black">All Spots</NuxtLink>
          <span>/</span>
          <span class="text-black">{{ stateDisplay }}</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-2">{{ stateDisplay }} Surf Report</h1>
        <p class="text-gray-600 max-w-2xl">{{ stateDescription }}</p>
      </div>

      <div v-if="!spots?.length && !spotsData" class="text-gray-500">Loading spots...</div>
      
      <div v-else-if="!spots?.length" class="text-center py-12">
        <p class="text-gray-500 mb-4">No spots found for {{ stateDisplay }}.</p>
        <NuxtLink to="/spots" class="text-blue-600 hover:underline">View all spots</NuxtLink>
      </div>

      <div v-else>
        <!-- Map -->
        <div class="mb-8">
          <SpotMap 
            :spots="spots" 
            :get-spot-color="getSpotColor" 
            :get-spot-label="getSpotLabel" 
          />
        </div>

        <!-- Best Right Now -->
        <div v-if="bestSpot" class="mb-8">
          <h2 class="text-lg font-bold uppercase mb-3 text-gray-500">Best Right Now</h2>
          <NuxtLink 
            :to="`/spots/${bestSpot.slug}`"
            class="block bg-white border-2 border-black rounded-lg p-4 sm:p-6 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <div class="flex justify-between items-start gap-4">
              <div>
                <h3 class="text-2xl font-black">{{ bestSpot.name }}</h3>
                <p class="text-gray-500">{{ bestSpot.region }}</p>
              </div>
              <div class="text-right">
                <p class="text-3xl font-black">{{ formatWaveHeight(bestSpot.forecast?.blended_wave_height ?? bestSpot.forecast?.wave_height) }}</p>
                <span 
                  class="inline-block px-3 py-1 rounded text-sm font-bold"
                  :style="{ backgroundColor: getSpotColor(bestSpot), color: getSpotScore(bestSpot) > 40 ? '#fff' : '#000' }"
                >
                  {{ getSpotLabel(bestSpot) }}
                </span>
              </div>
            </div>
            <div v-if="bestSpot.forecast" class="flex gap-6 mt-4 text-sm text-gray-600 font-mono">
              <span>{{ Math.round(bestSpot.forecast.swell_wave_period || bestSpot.forecast.wave_period || 0) }}s period</span>
              <span>{{ formatWind(bestSpot.forecast.wind_speed) }} wind</span>
              <span>{{ formatDirection(bestSpot.forecast.swell_wave_direction || bestSpot.forecast.wave_direction) }} swell</span>
            </div>
          </NuxtLink>
        </div>

        <!-- All Spots Grid -->
        <div>
          <h2 class="text-lg font-bold uppercase mb-3 text-gray-500">All {{ stateDisplay }} Spots</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NuxtLink 
              v-for="spot in sortedSpots" 
              :key="spot.id"
              :to="`/spots/${spot.slug}`"
              class="relative bg-white border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] p-4 sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
            >
              <!-- Rating color bar -->
              <div 
                :style="{ backgroundColor: getSpotColor(spot) }"
                class="absolute left-0 top-0 bottom-0 w-1.5"
              ></div>
              
              <div class="flex justify-between items-start gap-2 mb-3 pl-2">
                <div class="min-w-0">
                  <h3 class="font-bold text-lg truncate">{{ spot.name }}</h3>
                  <p class="text-sm text-gray-500">{{ spot.region }}</p>
                </div>
                <div v-if="spot.forecast" class="text-right flex-shrink-0">
                  <p class="text-xl sm:text-2xl font-black">{{ formatWaveHeight(spot.forecast.blended_wave_height ?? spot.forecast.wave_height) }}</p>
                  <p class="text-xs text-gray-500">{{ getSpotLabel(spot) }}</p>
                </div>
                <div v-else class="text-right text-gray-400">
                  <p class="text-lg">--</p>
                </div>
              </div>
              
              <div v-if="spot.forecast" class="flex gap-4 text-sm text-gray-600 font-mono pl-2">
                <span>{{ Math.round(spot.forecast.wave_period || 0) }}s</span>
                <span>{{ formatWind(spot.forecast.wind_speed) }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- State Info for SEO -->
        <div class="mt-12 bg-white border-2 border-black rounded-lg p-6">
          <h2 class="text-xl font-black uppercase mb-4">About {{ stateDisplay }} Surfing</h2>
          <div class="prose prose-sm max-w-none text-gray-600">
            <p>{{ stateLongDescription }}</p>
          </div>
        </div>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const { calculateRating, scoreToColor, scoreToLabel } = useHowzitRating()

// State slug mapping
const stateMap = {
  'maine': { name: 'Maine', abbrev: 'ME' },
  'me': { name: 'Maine', abbrev: 'ME' },
  'new-hampshire': { name: 'New Hampshire', abbrev: 'NH' },
  'nh': { name: 'New Hampshire', abbrev: 'NH' },
  'massachusetts': { name: 'Massachusetts', abbrev: 'MA' },
  'ma': { name: 'Massachusetts', abbrev: 'MA' },
  'rhode-island': { name: 'Rhode Island', abbrev: 'RI' },
  'ri': { name: 'Rhode Island', abbrev: 'RI' },
  'connecticut': { name: 'Connecticut', abbrev: 'CT' },
  'ct': { name: 'Connecticut', abbrev: 'CT' },
  'new-york': { name: 'New York', abbrev: 'NY' },
  'ny': { name: 'New York', abbrev: 'NY' },
  'new-jersey': { name: 'New Jersey', abbrev: 'NJ' },
  'nj': { name: 'New Jersey', abbrev: 'NJ' },
  'delaware': { name: 'Delaware', abbrev: 'DE' },
  'de': { name: 'Delaware', abbrev: 'DE' },
  'maryland': { name: 'Maryland', abbrev: 'MD' },
  'md': { name: 'Maryland', abbrev: 'MD' },
  'virginia': { name: 'Virginia', abbrev: 'VA' },
  'va': { name: 'Virginia', abbrev: 'VA' },
  'north-carolina': { name: 'North Carolina', abbrev: 'NC' },
  'nc': { name: 'North Carolina', abbrev: 'NC' },
  'south-carolina': { name: 'South Carolina', abbrev: 'SC' },
  'sc': { name: 'South Carolina', abbrev: 'SC' },
  'georgia': { name: 'Georgia', abbrev: 'GA' },
  'ga': { name: 'Georgia', abbrev: 'GA' },
  'florida': { name: 'Florida', abbrev: 'FL' },
  'fl': { name: 'Florida', abbrev: 'FL' },
}

const stateSlug = computed(() => route.params.state?.toLowerCase())
const stateInfo = computed(() => stateMap[stateSlug.value] || null)
const stateDisplay = computed(() => stateInfo.value?.name || route.params.state)

// State descriptions for SEO
const stateDescriptions = {
  'Maine': {
    short: 'Surf reports for Southern Maine beaches. Check conditions at Higgins Beach, Old Orchard, and more.',
    long: `Maine offers cold-water surfing with uncrowded lineups along its rugged coastline. Southern Maine spots like Higgins Beach and Scarborough pick up northeast swells particularly well. Fall and winter bring the most consistent surf from nor'easters, though summer hurricanes can deliver epic conditions. Water temps require a thick wetsuit year-round, but the tradeoff is solitude and quality waves.`
  },
  'New Hampshire': {
    short: 'New Hampshire Seacoast surf conditions. Live forecasts for Hampton Beach and Rye Beach.',
    long: `New Hampshire's short but surfable coastline centers around Hampton Beach and the Seacoast region. Despite having only 18 miles of coast, NH picks up solid swell from nor'easters and hurricanes. Hampton Beach is the most popular spot, offering consistent beach break waves. The tight-knit local surf community braves cold water year-round.`
  },
  'Massachusetts': {
    short: 'Surf reports for Cape Cod, Nantucket, and the South Shore. Real-time conditions across Massachusetts.',
    long: `Massachusetts surfing spans from the South Shore to the outer beaches of Cape Cod and Nantucket. Coast Guard Beach and Nauset on Cape Cod pick up east and northeast swells exceptionally well. Nantucket's south-facing beaches like Cisco and Surfside catch summer south swells. Fall hurricane season and winter nor'easters deliver the most consistent surf across the state.`
  },
  'Rhode Island': {
    short: 'Rhode Island surf reports for Narragansett, Ruggles, and Newport beaches. Live wave forecasts.',
    long: `Rhode Island punches above its weight in surf quality. Narragansett and the South County beaches offer consistent beach breaks, while Ruggles near Newport is known for more powerful reef-style waves. The state picks up south and southeast swells well, making it a prime destination during hurricane season. Point Judith and Matunuck are local favorites.`
  },
  'Connecticut': {
    short: 'Connecticut surf conditions from Fairfield to New London. Check Long Island Sound wave forecasts.',
    long: `Connecticut surfing is limited but possible along Long Island Sound. The state catches wrap-around swell during larger south swells and hurricane events. Spots like Westport and Silver Sands offer occasional rideable waves. While not a primary surf destination, dedicated locals make the most of the conditions when they arrive.`
  },
  'New York': {
    short: 'Surf reports for Long Island and NYC beaches. Check conditions at Rockaway, Long Beach, Montauk and more.',
    long: `New York surfing centers around Long Island's south-facing beaches, from the Rockaways in Queens to the points of Montauk. The region picks up south and east swells, with fall hurricane season bringing the most consistent waves. Rockaway Beach offers easy access from NYC, while Montauk provides more powerful waves and a true surf town atmosphere.`
  },
  'New Jersey': {
    short: 'Real-time surf reports and forecasts for the Jersey Shore. From Sandy Hook to Cape May, find the best waves today.',
    long: `New Jersey offers over 130 miles of coastline with consistent beach breaks perfect for all skill levels. The best surf typically arrives from hurricane swells in late summer and fall, or nor'easters in winter. Popular spots include Manasquan Inlet, Asbury Park, and Long Beach Island. Morning sessions often offer the cleanest conditions before afternoon sea breezes pick up.`
  },
  'Delaware': {
    short: 'Delaware beach surf reports. Live conditions for Rehoboth, Dewey, Bethany, and Fenwick Island.',
    long: `Delaware's beach towns offer consistent surf along their east-facing shores. Rehoboth, Dewey, and Bethany beaches pick up northeast and east swells well. The sandbars shift seasonally, creating different peaks throughout the year. Hurricane season brings the biggest waves, while winter nor'easters provide regular swells. The compact coastline means you can check multiple spots quickly.`
  },
  'Maryland': {
    short: 'Ocean City Maryland surf report. Real-time conditions for the OC beaches and Assateague Island.',
    long: `Ocean City, Maryland is the state's surf hub, with multiple jetties creating sandbar formations along the beach. The inlet and pier areas are popular spots that handle a variety of swell directions. Assateague Island to the south offers a more natural beach break experience. Hurricane season and fall nor'easters bring the most consistent surf to Maryland's shores.`
  },
  'Virginia': {
    short: 'Virginia Beach surf conditions. Live forecasts for the Oceanfront, Croatan, and Sandbridge.',
    long: `Virginia Beach is the mid-Atlantic's most developed surf scene, with the Oceanfront, Croatan, and Sandbridge offering distinct experiences. The pier and jetty areas create reliable sandbars. Virginia Beach picks up south through northeast swells and is well-positioned for hurricane swells. The Eastern Shore's Chincoteague offers a more remote option when conditions align.`
  },
  'North Carolina': {
    short: 'Outer Banks and NC coast surf conditions. Live forecasts from Hatteras to Wrightsville Beach.',
    long: `North Carolina's Outer Banks is one of the East Coast's premier surf destinations. Cape Hatteras picks up more swell than almost anywhere else on the Atlantic seaboard, thanks to its position jutting into the ocean. The region offers everything from mellow beach breaks to powerful sandbars. Hurricane season (August-October) brings the biggest swells, but winter nor'easters provide consistent action.`
  },
  'South Carolina': {
    short: 'South Carolina surf reports for Myrtle Beach, Folly Beach, and the Grand Strand.',
    long: `South Carolina offers mellow beach breaks along the Grand Strand and around Charleston. Folly Beach near Charleston is the state's most dedicated surf spot with a consistent local scene. The Grand Strand beaches from Cherry Grove to Pawleys Island pick up south swells during hurricane season. Waves are generally smaller than points north, but the warm water and relaxed vibe attract surfers year-round.`
  },
  'Georgia': {
    short: 'Georgia coast surf conditions. Check Tybee Island and the Golden Isles wave forecasts.',
    long: `Georgia's surf scene centers on Tybee Island near Savannah and the Golden Isles to the south. The wide continental shelf and offshore islands limit swell exposure, but hurricane season and strong nor'easters can deliver fun waves. Tybee Island is the most accessible spot with a dedicated local crew. Jekyll Island and St. Simons offer alternatives when conditions align.`
  },
  'Florida': {
    short: 'Florida surf reports from Jacksonville to Miami. Real-time conditions for Sebastian Inlet, Cocoa Beach, New Smyrna and more.',
    long: `Florida offers year-round surfing along its Atlantic coast, with the Space Coast and Volusia County regions being the most consistent. Sebastian Inlet is considered one of the best waves on the East Coast when conditions align. New Smyrna Beach sees more shark encounters than anywhere else but remains hugely popular. Hurricane season (June-November) brings the biggest swells, while winter cold fronts push rideable waves to the coast. The Gulf Coast gets occasional surf during tropical systems.`
  }
}

const stateDescription = computed(() => 
  stateDescriptions[stateDisplay.value]?.short || `Surf reports and forecasts for ${stateDisplay.value}.`
)

const stateLongDescription = computed(() => 
  stateDescriptions[stateDisplay.value]?.long || `Check current surf conditions across ${stateDisplay.value}. Our forecasts are updated hourly with wave height, period, wind, and conditions ratings.`
)

// SSR-compatible data fetching - match pattern from [slug].vue
const { data: spotsData } = await useAsyncData(`state-spots-${route.params.state}`, async () => {
  // Get state param directly from route (works during SSR)
  const stateParam = route.params.state?.toLowerCase()
  if (!stateParam) return null
  
  const stateData = stateMap[stateParam]
  if (!stateData) return null
  
  const { data } = await supabase
    .from('spots')
    .select('*')
    .eq('state', stateData.name)
    .order('name')
  
  return data
})

// Spots with forecasts (loaded client-side for performance)
const spots = ref(spotsData.value || [])
const loading = ref(false)

// Load forecasts client-side after initial render
onMounted(async () => {
  if (!spots.value?.length) return
  
  loading.value = true
  
  const spotsWithForecasts = await Promise.all(
    spots.value.map(async (spot) => {
      const { data: forecast } = await supabase
        .from('forecasts')
        .select('*')
        .eq('spot_id', spot.id)
        .gte('timestamp', new Date().toISOString())
        .order('timestamp', { ascending: true })
        .limit(1)
        .single()
      
      return { ...spot, forecast }
    })
  )
  
  spots.value = spotsWithForecasts
  loading.value = false
})

// Rating helpers
const getSpotScore = (spot) => {
  if (!spot.forecast) return 0
  const f = spot.forecast
  return calculateRating({
    waveHeight: f.blended_wave_height ?? f.wave_height,
    wavePeriod: f.blended_wave_period ?? f.wave_period,
    waveDirection: f.blended_wave_direction ?? f.wave_direction,
    swellWaveHeight: f.swell_wave_height,
    swellWavePeriod: f.swell_wave_period,
    swellWaveDirection: f.swell_wave_direction,
    windWaveHeight: f.wind_wave_height,
    windWavePeriod: f.wind_wave_period,
    windWaveDirection: f.wind_wave_direction,
    secondarySwellHeight: f.secondary_swell_height,
    secondarySwellPeriod: f.secondary_swell_period,
    secondarySwellDirection: f.secondary_swell_direction,
    windSpeed: f.wind_speed,
    windDirection: f.wind_direction,
    windGust: f.wind_gust,
    beachOrientation: spot.orientation || 90
  })
}

const getSpotColor = (spot) => scoreToColor(getSpotScore(spot))
const getSpotLabel = (spot) => scoreToLabel(getSpotScore(spot))

const bestSpot = computed(() => {
  if (!spots.value?.length) return null
  return [...spots.value].sort((a, b) => getSpotScore(b) - getSpotScore(a))[0]
})

const sortedSpots = computed(() => {
  if (!spots.value?.length) return []
  return [...spots.value].sort((a, b) => getSpotScore(b) - getSpotScore(a))
})

const formatWaveHeight = (heightMeters) => {
  if (!heightMeters) return '--'
  const feet = heightMeters * 3.281
  const min = Math.max(1, Math.round(feet) - 1)
  const max = Math.round(feet) + 1
  if (min === max) return `${min}ft`
  return `${min}-${max}ft`
}

const formatWind = (kmh) => {
  if (!kmh) return '--'
  return `${Math.round(kmh * 0.621)}mph`
}

const formatDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return '--'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}

const siteUrl = 'https://hwztsurf.com'

const canonicalUrl = computed(() => 
  stateSlug.value ? `${siteUrl}/spots/state/${stateSlug.value}` : ''
)

const jsonLd = computed(() => {
  if (!stateDisplay.value || !spots.value.length) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${stateDisplay.value} Surf Report & Forecast`,
    description: stateDescription.value,
    url: canonicalUrl.value,
    mainEntity: {
      '@type': 'ItemList',
      name: `${stateDisplay.value} Surf Spots`,
      description: `Surf spots in ${stateDisplay.value}`,
      numberOfItems: spots.value.length,
      itemListElement: spots.value.slice(0, 10).map((spot, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Beach',
          name: spot.name,
          description: `Surf spot in ${spot.region}, ${stateDisplay.value}`,
          url: `${siteUrl}/spots/${spot.slug}`,
          geo: spot.latitude && spot.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: spot.latitude,
            longitude: spot.longitude
          } : undefined,
          address: {
            '@type': 'PostalAddress',
            addressRegion: stateDisplay.value,
            addressLocality: spot.region,
            addressCountry: 'US'
          }
        }
      }))
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'All Spots', item: `${siteUrl}/spots` },
        { '@type': 'ListItem', position: 3, name: stateDisplay.value, item: canonicalUrl.value }
      ]
    },
    publisher: { '@type': 'Organization', name: 'Howzit', url: siteUrl }
  }
})

useHead({
  title: computed(() => `${stateDisplay.value} Surf Report & Forecast - Live Conditions | Howzit`),
  meta: [
    { name: 'description', content: stateDescription },
    { property: 'og:title', content: computed(() => `${stateDisplay.value} Surf Report & Forecast - Live Conditions | Howzit`) },
    { property: 'og:description', content: stateDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonicalUrl },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => jsonLd.value ? JSON.stringify(jsonLd.value) : '')
    }
  ]
})
</script>
