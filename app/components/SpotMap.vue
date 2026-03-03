<template>
  <ClientOnly>
    <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b-2 border-black bg-gray-50">
        <h2 class="font-bold uppercase text-sm text-gray-600">Spot Map</h2>
      </div>
      <div ref="mapContainer" :class="heightClass" class="w-full"></div>
    </div>
    <template #fallback>
      <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b-2 border-black bg-gray-50">
          <h2 class="font-bold uppercase text-sm text-gray-600">Spot Map</h2>
        </div>
        <div :class="heightClass" class="w-full flex items-center justify-center bg-gray-100">
          <span class="text-gray-400">Loading map...</span>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
const props = defineProps({
  spots: {
    type: Array,
    required: true
  },
  getSpotColor: {
    type: Function,
    default: () => '#3b82f6'
  },
  getSpotLabel: {
    type: Function,
    default: () => 'Good'
  },
  height: {
    type: String,
    default: 'default' // 'default' | 'tall'
  },
  selectedRegion: {
    type: String,
    default: null
  }
})

const heightClass = computed(() => {
  return props.height === 'tall' 
    ? 'h-[400px] sm:h-[600px]' 
    : 'h-[300px] sm:h-[400px]'
})

const mapContainer = ref(null)
let map = null
let markers = []
let L = null

const initMap = async () => {
  if (!mapContainer.value || !props.spots.length) return
  if (typeof window === 'undefined') return
  
  try {
    // Dynamic import for SSR compatibility
    const leafletModule = await import('leaflet')
    L = leafletModule.default || leafletModule
    
    // Import Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Calculate bounds from spots
    const validSpots = props.spots.filter(s => s.latitude && s.longitude)
    if (!validSpots.length) return

    const lats = validSpots.map(s => s.latitude)
    const lngs = validSpots.map(s => s.longitude)
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    )

    // Initialize map
    map = L.map(mapContainer.value, {
      scrollWheelZoom: false,
      attributionControl: false
    }).fitBounds(bounds, { padding: [30, 30] })

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map)

    // Add markers
    updateMarkers()
  } catch (err) {
    console.error('Map init error:', err)
  }
}

const updateMarkers = () => {
  if (!map || !L) return

  markers.forEach(m => map.removeLayer(m))
  markers = []

  const validSpots = props.spots.filter(s => s.latitude && s.longitude)
  
  validSpots.forEach(spot => {
    const color = props.getSpotColor(spot)
    const label = props.getSpotLabel(spot)
    
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid black;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.5);
          cursor: pointer;
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    })

    // Build wave info for popup
    const waveHt = spot.forecast?.blended_wave_height ?? spot.forecast?.wave_height
    const waveFt = waveHt ? (waveHt * 3.281) : null
    const waveStr = waveFt ? `${Math.max(1, Math.round(waveFt) - 1)}-${Math.round(waveFt) + 1}ft` : '--'
    const periodStr = spot.forecast ? `${Math.round(spot.forecast.swell_wave_period || spot.forecast.wave_period || 0)}s` : ''

    const marker = L.marker([spot.latitude, spot.longitude], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui; min-width: 160px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${spot.name}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 6px;">${spot.region || ''}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="
              display: inline-block;
              background-color: ${color};
              color: ${isLightColor(color) ? '#000' : '#fff'};
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            ">${label}</span>
            <span style="font-size: 14px; font-weight: 900; font-family: monospace;">${waveStr}</span>
            ${periodStr ? `<span style="font-size: 11px; color: #666;">${periodStr}</span>` : ''}
          </div>
          <a href="/spots/${spot.slug}" style="
            display: block;
            color: #000;
            font-size: 12px;
            font-weight: bold;
            text-decoration: underline;
          ">View Forecast →</a>
        </div>
      `, {
        closeButton: false,
        className: 'custom-popup'
      })

    markers.push(marker)
  })
}

const fitBoundsToSpots = () => {
  if (!map || !L || !props.spots.length) return
  
  const validSpots = props.spots.filter(s => s.latitude && s.longitude)
  if (!validSpots.length) return
  
  const lats = validSpots.map(s => s.latitude)
  const lngs = validSpots.map(s => s.longitude)
  const bounds = L.latLngBounds(
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  )
  
  map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 0.5 })
}

const isLightColor = (color) => {
  if (!color) return false
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

onMounted(() => {
  setTimeout(async () => {
    await initMap()
    // Invalidate size after map renders (fixes container sizing on toggle)
    if (map) {
      setTimeout(() => map.invalidateSize(), 100)
    }
  }, 200)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Watch for spot changes (filtering) - update markers and re-fit bounds
watch(() => props.spots, () => {
  if (map && L) {
    updateMarkers()
    fitBoundsToSpots()
  }
}, { deep: true })

// Watch for region changes specifically to ensure map recenters
watch(() => props.selectedRegion, () => {
  if (map && L) {
    // Small delay to let the spots filter apply first
    setTimeout(() => {
      updateMarkers()
      fitBoundsToSpots()
    }, 50)
  }
})
</script>

<style>
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: 8px;
  border: 2px solid black;
  box-shadow: 4px 4px 0px rgba(0,0,0,0.8);
}

.custom-popup .leaflet-popup-tip {
  border-top-color: black;
}

.leaflet-container {
  font-family: system-ui, -apple-system, sans-serif;
}
</style>
