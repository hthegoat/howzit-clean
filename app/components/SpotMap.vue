<template>
  <ClientOnly>
    <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b-2 border-black bg-gray-50">
        <h2 class="font-bold uppercase text-sm text-gray-600">Spot Map</h2>
      </div>
      <div ref="mapContainer" class="h-[300px] sm:h-[400px] w-full"></div>
    </div>
    <template #fallback>
      <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b-2 border-black bg-gray-50">
          <h2 class="font-bold uppercase text-sm text-gray-600">Spot Map</h2>
        </div>
        <div class="h-[300px] sm:h-[400px] w-full flex items-center justify-center bg-gray-100">
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
    default: () => 'Fair'
  }
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

    const marker = L.marker([spot.latitude, spot.longitude], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui; min-width: 150px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${spot.name}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${spot.region || ''}</div>
          <div style="
            display: inline-block;
            background-color: ${color};
            color: ${isLightColor(color) ? '#000' : '#fff'};
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
          ">${label}</div>
          <a href="/spots/${spot.slug}" style="
            display: block;
            margin-top: 8px;
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
  setTimeout(initMap, 200)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(() => props.spots, () => {
  if (map && L) {
    updateMarkers()
  }
}, { deep: true })
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
