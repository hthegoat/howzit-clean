<template>
  <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
    <div class="px-4 py-3 border-b-2 border-black">
      <h3 class="font-black uppercase">Spot Map</h3>
    </div>
    <div ref="mapContainer" class="h-[300px] sm:h-[400px] w-full"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  spots: { type: Array, required: true },
  getSpotColor: { type: Function, required: true },
  getSpotLabel: { type: Function, required: true }
})

const mapContainer = ref(null)
let map = null
let markers = []

const formatWaveHeight = (heightMeters) => {
  if (!heightMeters) return '--'
  const feet = heightMeters * 3.281
  const min = Math.max(1, Math.round(feet) - 1)
  const max = Math.round(feet) + 1
  if (min === max) return `${min}ft`
  return `${min}-${max}ft`
}

const initMap = async () => {
  if (!mapContainer.value || !props.spots.length) return
  
  // Dynamic import Leaflet
  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  
  // Calculate center from spots
  const lats = props.spots.filter(s => s.latitude).map(s => s.latitude)
  const lngs = props.spots.filter(s => s.longitude).map(s => s.longitude)
  
  if (!lats.length) return
  
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  
  // Initialize map
  map = L.map(mapContainer.value, {
    scrollWheelZoom: false
  }).setView([centerLat, centerLng], 8)
  
  // Add tile layer (CartoDB Positron - clean, minimal style)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map)
  
  // Add markers for each spot
  props.spots.forEach(spot => {
    if (!spot.latitude || !spot.longitude) return
    
    const color = props.getSpotColor(spot)
    const label = props.getSpotLabel(spot)
    const waveHeight = formatWaveHeight(spot.forecast?.wave_height)
    
    // Custom circle marker with rating color
    const marker = L.circleMarker([spot.latitude, spot.longitude], {
      radius: 10,
      fillColor: color,
      color: '#000',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map)
    
    // Popup content
    const popupContent = `
      <div style="min-width: 150px; font-family: system-ui, sans-serif;">
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">${spot.name}</div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${spot.region}</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 18px;">${waveHeight}</span>
          <span style="background: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${label}</span>
        </div>
        <a href="/spots/${spot.slug}" style="display: block; margin-top: 10px; text-align: center; background: #000; color: #fff; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 12px;">View Forecast →</a>
      </div>
    `
    
    marker.bindPopup(popupContent, {
      closeButton: true,
      className: 'custom-popup'
    })
    
    markers.push(marker)
  })
  
  // Fit bounds to show all markers with padding
  if (markers.length > 1) {
    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.1))
  }
}

onMounted(() => {
  initMap()
})

watch(() => props.spots, () => {
  if (map) {
    markers.forEach(m => map.removeLayer(m))
    markers = []
    initMap()
  }
}, { deep: true })
</script>

<style>
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: 8px;
  border: 2px solid #000;
  box-shadow: 3px 3px 0 #000;
}
.custom-popup .leaflet-popup-tip {
  border-top-color: #000;
}
</style>
