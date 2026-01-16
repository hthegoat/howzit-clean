<template>
  <div class="bg-white border-2 border-black rounded-lg overflow-hidden sm:shadow-[4px_4px_0px_#000]">
    <!-- Header -->
    <div class="px-4 py-3 border-b-2 border-black flex justify-between items-center flex-wrap gap-2">
      <div>
        <h3 class="font-black uppercase">Swell Radar</h3>
        <p class="text-xs text-gray-500 font-mono">{{ regionLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500">Primary swell:</span>
        <span class="font-mono text-sm font-bold">{{ primarySwellLabel }}</span>
      </div>
    </div>

    <!-- Map Container -->
    <div class="relative">
      <div ref="mapContainer" class="h-[350px] sm:h-[450px] w-full"></div>
      
      <!-- Legend Overlay -->
      <div class="absolute bottom-3 left-3 bg-white/95 border-2 border-black rounded px-3 py-2 text-xs">
        <div class="font-bold mb-1.5 uppercase text-[10px] text-gray-500">Swell Direction</div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path d="M12 4l-6 8h4v8h4v-8h4z" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>
            </svg>
            <span>Primary</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path d="M12 4l-6 8h4v8h4v-8h4z" fill="#f472b6" stroke="#be185d" stroke-width="1"/>
            </svg>
            <span>Secondary</span>
          </div>
        </div>
      </div>

      <!-- Swell Info Panel -->
      <div v-if="dominantSwell" class="absolute top-3 right-3 bg-white/95 border-2 border-black rounded px-3 py-2 text-xs max-w-[180px]">
        <div class="font-bold mb-1.5 uppercase text-[10px] text-gray-500">Incoming Swell</div>
        <div class="space-y-1 font-mono">
          <div class="flex justify-between">
            <span class="text-gray-500">Height</span>
            <span class="font-bold">{{ formatHeight(dominantSwell.height) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Period</span>
            <span class="font-bold">{{ dominantSwell.period }}s</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Direction</span>
            <span class="font-bold">{{ formatDirection(dominantSwell.direction) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with timestamp -->
    <div class="px-4 py-2 border-t-2 border-black bg-gray-50">
      <p class="text-xs text-gray-500 font-mono">
        Updated: {{ formattedTimestamp }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  state: { type: String, default: null },
  region: { type: String, default: null },
  spots: { type: Array, default: () => [] }
})

const supabase = useSupabaseClient()
const { scoreToColor, scoreToLabel, formatDirection } = useHowzitRating()

const mapContainer = ref(null)
const spotsWithForecasts = ref([])
const loading = ref(true)
let map = null
let markersLayer = null

// Region config for map bounds
const regionBounds = {
  'new-jersey': { center: [39.7, -74.1], zoom: 9 },
  'new-york': { center: [40.7, -73.2], zoom: 9 },
  'north-carolina': { center: [35.2, -75.7], zoom: 8 },
  'florida': { center: [28.5, -80.5], zoom: 7 },
  'massachusetts': { center: [41.7, -70.3], zoom: 9 },
  'rhode-island': { center: [41.4, -71.5], zoom: 10 },
  'connecticut': { center: [41.2, -72.8], zoom: 10 },
  'delaware': { center: [38.7, -75.1], zoom: 10 },
  'maryland': { center: [38.3, -75.1], zoom: 10 },
  'virginia': { center: [36.9, -76.0], zoom: 9 },
  'south-carolina': { center: [33.0, -79.5], zoom: 8 },
  'georgia': { center: [31.5, -81.2], zoom: 9 },
  'maine': { center: [43.7, -70.2], zoom: 9 },
  'new-hampshire': { center: [42.9, -70.8], zoom: 11 }
}

const regionLabel = computed(() => {
  if (props.state) {
    return props.state.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
  return 'East Coast'
})

const dominantSwell = computed(() => {
  if (!spotsWithForecasts.value.length) return null
  
  // Get the spot with the largest swell
  const sorted = [...spotsWithForecasts.value]
    .filter(s => s.forecast?.swell_wave_height)
    .sort((a, b) => (b.forecast?.swell_wave_height || 0) - (a.forecast?.swell_wave_height || 0))
  
  if (!sorted.length) return null
  
  const f = sorted[0].forecast
  return {
    height: f.swell_wave_height,
    period: Math.round(f.swell_wave_period || f.wave_period || 0),
    direction: f.swell_wave_direction || f.blended_wave_direction
  }
})

const primarySwellLabel = computed(() => {
  if (!dominantSwell.value) return '--'
  return `${formatHeight(dominantSwell.value.height)} @ ${dominantSwell.value.period}s from ${formatDirection(dominantSwell.value.direction)}`
})

const formattedTimestamp = computed(() => {
  const first = spotsWithForecasts.value[0]?.forecast?.fetched_at
  if (!first) return '--'
  return new Date(first).toLocaleString()
})

const formatHeight = (meters) => {
  if (!meters) return '--'
  const feet = meters * 3.281
  return `${feet.toFixed(1)}ft`
}

const formatHeightRange = (meters) => {
  if (!meters) return '--'
  const feet = meters * 3.281
  const min = Math.max(1, Math.round(feet) - 1)
  const max = Math.round(feet) + 1
  return `${min}-${max}ft`
}

// Fetch spots and their current forecasts
const fetchData = async () => {
  loading.value = true
  
  try {
    let query = supabase
      .from('spots')
      .select('id, name, slug, latitude, longitude, state, region, orientation')
      .not('latitude', 'is', null)
    
    if (props.state) {
      // Convert slug to state name for matching
      const stateName = props.state.replace(/-/g, ' ')
      query = query.ilike('state', stateName)
    }
    
    const { data: spots, error } = await query
    
    if (error) throw error
    if (!spots?.length) {
      spotsWithForecasts.value = []
      return
    }
    
    // Fetch latest forecast for each spot
    const spotIds = spots.map(s => s.id)
    const now = new Date().toISOString()
    
    const { data: forecasts, error: forecastError } = await supabase
      .from('forecasts')
      .select('*')
      .in('spot_id', spotIds)
      .gte('timestamp', now)
      .order('timestamp', { ascending: true })
    
    if (forecastError) throw forecastError
    
    // Match each spot with its nearest forecast
    const forecastMap = {}
    forecasts?.forEach(f => {
      if (!forecastMap[f.spot_id]) {
        forecastMap[f.spot_id] = f
      }
    })
    
    spotsWithForecasts.value = spots.map(spot => ({
      ...spot,
      forecast: forecastMap[spot.id] || null
    }))
    
  } catch (e) {
    console.error('SwellRadar fetch error:', e)
  } finally {
    loading.value = false
  }
}

// Create arrow SVG for swell direction
const createSwellArrow = (direction, height, period, isPrimary = true) => {
  // Arrow points in direction swell is GOING (toward shore)
  // Direction is where swell comes FROM, so arrow points opposite
  const rotation = direction !== null ? (direction + 180) % 360 : 0
  
  // Size based on wave height (meters) - smaller range
  const size = Math.min(32, Math.max(18, (height || 1) * 12))
  
  // Color based on primary/secondary
  const fillColor = isPrimary ? '#3b82f6' : '#f472b6'
  const strokeColor = isPrimary ? '#1e40af' : '#be185d'
  
  // Opacity based on period (longer period = more solid)
  const opacity = Math.min(0.95, 0.6 + (period || 6) / 25)
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg); opacity: ${opacity};">
      <path d="M12 4L7 12h3v8h4v-8h3L12 4z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
    </svg>
  `
}

// Create spot marker with swell arrows
const createSpotMarker = (spot) => {
  const f = spot.forecast
  if (!f) return null
  
  const { calculateRating, scoreToLabel, scoreToColor } = useHowzitRating()
  
  const rating = calculateRating({
    waveHeight: f.blended_wave_height || f.wave_height,
    wavePeriod: f.blended_wave_period || f.wave_period,
    windWaveHeight: f.wind_wave_height,
    windWavePeriod: f.wind_wave_period,
    swellWaveHeight: f.swell_wave_height,
    swellWavePeriod: f.swell_wave_period,
    swellWaveDirection: f.swell_wave_direction,
    windSpeed: f.wind_speed,
    windDirection: f.wind_direction,
    windGust: f.wind_gust,
    beachOrientation: spot.orientation || 90
  })
  
  const color = scoreToColor(rating)
  const label = scoreToLabel(rating)
  const waveHeight = formatHeightRange(f.blended_wave_height || f.wave_height)
  
  // Primary swell arrow
  const primaryDir = f.swell_wave_direction || f.blended_wave_direction || f.wave_direction
  const primaryArrow = createSwellArrow(
    primaryDir,
    f.swell_wave_height || f.wave_height,
    f.swell_wave_period || f.wave_period,
    true
  )
  
  // Secondary swell arrow - only show if significant (> 0.5m / ~1.5ft) and different direction
  let secondaryArrow = ''
  const primaryHeight = f.swell_wave_height || f.wave_height || 0
  if (f.secondary_swell_height && f.secondary_swell_height > 0.5 && f.secondary_swell_height > primaryHeight * 0.4) {
    // Only show if direction is meaningfully different (> 30 degrees)
    const dirDiff = f.secondary_swell_direction && primaryDir ? 
      Math.abs(f.secondary_swell_direction - primaryDir) : 180
    const normalizedDiff = dirDiff > 180 ? 360 - dirDiff : dirDiff
    
    if (normalizedDiff > 30) {
      secondaryArrow = createSwellArrow(
        f.secondary_swell_direction,
        f.secondary_swell_height,
        f.secondary_swell_period,
        false
      )
    }
  }
  
  return {
    color,
    label,
    waveHeight,
    rating,
    primaryArrow,
    secondaryArrow,
    primaryDir,
    secondaryDir: f.secondary_swell_direction
  }
}

const initMap = async () => {
  if (!mapContainer.value) return
  
  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  
  // Get region bounds or calculate from spots
  const stateKey = props.state?.toLowerCase()
  const bounds = regionBounds[stateKey]
  
  let center = [39.5, -74.5]
  let zoom = 8
  
  if (bounds) {
    center = bounds.center
    zoom = bounds.zoom
  } else if (spotsWithForecasts.value.length) {
    const lats = spotsWithForecasts.value.filter(s => s.latitude).map(s => s.latitude)
    const lngs = spotsWithForecasts.value.filter(s => s.longitude).map(s => s.longitude)
    if (lats.length) {
      center = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2]
    }
  }
  
  map = L.map(mapContainer.value, {
    scrollWheelZoom: false,
    zoomControl: true
  }).setView(center, zoom)
  
  // Dark ocean-focused tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map)
  
  markersLayer = L.layerGroup().addTo(map)
  
  updateMarkers()
}

const updateMarkers = async () => {
  if (!map || !markersLayer) return
  
  const L = (await import('leaflet')).default
  
  markersLayer.clearLayers()
  
  spotsWithForecasts.value.forEach(spot => {
    if (!spot.latitude || !spot.longitude) return
    
    const markerData = createSpotMarker(spot)
    if (!markerData) return
    
    // Create custom div icon with swell arrows
    // Position arrow based on swell direction so it points toward the spot
    const arrowRotation = markerData.primaryDir !== null ? (markerData.primaryDir + 180) % 360 : 0
    
    const iconHtml = `
      <div class="swell-marker" style="position: relative; width: 60px; height: 60px;">
        <div class="swell-arrow-primary" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translate(-20px, 0);
        ">
          ${markerData.primaryArrow}
        </div>
        ${markerData.secondaryArrow ? `
        <div class="swell-arrow-secondary" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translate(-18px, 14px);
          opacity: 0.85;
        ">
          ${markerData.secondaryArrow}
        </div>
        ` : ''}
        <div class="spot-dot" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          background: ${markerData.color};
          border: 2px solid #000;
          border-radius: 50%;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
          z-index: 10;
        "></div>
      </div>
    `
    
    const icon = L.divIcon({
      html: iconHtml,
      className: 'swell-marker-container',
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    })
    
    const marker = L.marker([spot.latitude, spot.longitude], { icon })
    
    // Popup
    const popupContent = `
      <div style="min-width: 160px; font-family: 'DM Sans', system-ui, sans-serif;">
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px;">${spot.name}</div>
        <div style="color: #666; font-size: 11px; margin-bottom: 8px;">${spot.region || ''}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 700; font-size: 18px; font-family: 'JetBrains Mono', monospace;">${markerData.waveHeight}</span>
          <span style="background: ${markerData.color}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: ${markerData.rating > 40 ? '#fff' : '#000'};">${markerData.label}</span>
        </div>
        <div style="font-size: 11px; color: #666; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px;">
          <div>Swell: ${formatDirection(markerData.primaryDir)} @ ${Math.round(spot.forecast?.swell_wave_period || spot.forecast?.wave_period || 0)}s</div>
        </div>
        <a href="/spots/${spot.slug}" style="display: block; text-align: center; background: #000; color: #fff; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 12px;">View Forecast →</a>
      </div>
    `
    
    marker.bindPopup(popupContent, {
      closeButton: true,
      className: 'howzit-popup'
    })
    
    markersLayer.addLayer(marker)
  })
}

onMounted(async () => {
  await fetchData()
  await initMap()
})

watch(() => props.state, async () => {
  await fetchData()
  if (map) {
    const stateKey = props.state?.toLowerCase()
    const bounds = regionBounds[stateKey]
    if (bounds) {
      map.setView(bounds.center, bounds.zoom)
    }
  }
  updateMarkers()
})

watch(spotsWithForecasts, () => {
  updateMarkers()
}, { deep: true })
</script>

<style>
.swell-marker-container {
  background: transparent !important;
  border: none !important;
}

.howzit-popup .leaflet-popup-content-wrapper {
  border-radius: 6px;
  border: 2px solid #000;
  box-shadow: 3px 3px 0 #000;
  padding: 0;
}

.howzit-popup .leaflet-popup-content {
  margin: 12px;
}

.howzit-popup .leaflet-popup-tip {
  background: #fff;
  border: 2px solid #000;
  box-shadow: none;
}
</style>
