<template>
  <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center px-4 py-3 border-b-2 border-black">
      <h2 class="font-black uppercase">Surf Graph</h2>
      <div class="flex border-2 border-black rounded overflow-hidden text-sm">
        <button 
          @click="mode = 'surf'; render()" 
          :class="mode === 'surf' ? 'bg-black text-white' : 'bg-white text-black'"
          class="px-3 py-1 font-bold uppercase text-xs"
        >
          Surf
        </button>
        <button 
          @click="mode = 'swell'; render()" 
          :class="mode === 'swell' ? 'bg-black text-white' : 'bg-white text-black'"
          class="px-3 py-1 font-bold uppercase text-xs"
        >
          Swell
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="p-4">
      <div ref="chart" class="w-full" style="height: 150px;"></div>

      <!-- Legend -->
      <div class="flex justify-center gap-4 mt-3 text-xs font-medium">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-emerald-500 border border-black"></div>
          <span>Clean</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-blue-500 border border-black"></div>
          <span>Fair</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-rose-400 border border-black"></div>
          <span>Choppy</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 bg-gray-300 border border-black"></div>
          <span>Flat</span>
        </div>
      </div>
    </div>

    <!-- Detail Panel -->
    <div v-if="hovered" class="px-4 py-3 bg-gray-100 border-t-2 border-black">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span class="font-black">{{ hovered.label }}</span>
        <span class="font-mono">{{ hovered.height }}ft</span>
        <span class="font-mono text-gray-600">{{ hovered.swell }}</span>
        <span class="font-mono text-gray-600">{{ hovered.wind }}</span>
        <span v-if="hovered.tide !== null" class="font-mono text-blue-600">{{ hovered.tide.toFixed(1) }}ft {{ hovered.tideState }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, provide } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  forecasts: { type: Array, required: true },
  beachOrientation: { type: Number, default: 90 },
  tides: { type: Array, default: () => [] }
})

const emit = defineEmits(['hover', 'hoverEnd'])

const { calculateRating } = useHowzitRating()

const mode = ref('surf')
const chart = ref(null)
const hovered = ref(null)

// Tide interpolation
const getTideHeight = (timeMs) => {
  if (!props.tides?.length) return null
  
  const sortedTides = props.tides
    .map(t => ({ ...t, time: new Date(t.timestamp).getTime() }))
    .sort((a, b) => a.time - b.time)
  
  let before = null
  let after = null
  
  for (let i = 0; i < sortedTides.length; i++) {
    if (sortedTides[i].time <= timeMs) before = sortedTides[i]
    if (sortedTides[i].time > timeMs && !after) after = sortedTides[i]
  }
  
  if (!before && !after) return null
  if (!before) return after.height
  if (!after) return before.height
  
  const duration = after.time - before.time
  if (duration <= 0) return before.height
  
  const t = (timeMs - before.time) / duration
  const cosT = (1 - Math.cos(t * Math.PI)) / 2
  
  return before.height + (after.height - before.height) * cosT
}

const getTideState = (timeMs) => {
  if (!props.tides?.length) return null
  
  const sortedTides = props.tides
    .map(t => ({ ...t, time: new Date(t.timestamp).getTime() }))
    .sort((a, b) => a.time - b.time)
  
  // Find next tide after this time
  const nextTide = sortedTides.find(t => t.time > timeMs)
  if (!nextTide) return null
  
  return nextTide.type === 'HIGH' ? 'Rising' : 'Falling'
}

const data = computed(() => {
  return props.forecasts.map((f, i) => {
    const date = new Date(f.timestamp)
    const toFt = m => m ? +(m * 3.281).toFixed(1) : 0
    const toMph = k => k ? Math.round(k * 0.621) : 0
    
    const rating = calculateRating({
      waveHeight: f.wave_height,
      wavePeriod: f.wave_period,
      waveDirection: f.wave_direction,
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
      beachOrientation: props.beachOrientation
    })

    const dir = deg => {
      if (deg == null) return ''
      const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
      return d[Math.round(deg / 22.5) % 16]
    }

    return {
      i,
      date,
      hour: date.getHours(),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      height: toFt(f.wave_height),
      swell: toFt(f.swell_wave_height),
      period: Math.round(f.swell_wave_period) || 0,
      swellDir: dir(f.swell_wave_direction),
      windSpd: toMph(f.wind_speed),
      windDir: dir(f.wind_direction),
      rating
    }
  })
})

const color = r => {
  if (r >= 55) return '#10b981'  // green - Clean
  if (r >= 35) return '#3b82f6'  // blue - Fair
  if (r >= 10) return '#fb7185'  // pink - Choppy/Poor
  return '#d1d5db'               // gray - Flat
}

// Get display height - scale down based on rating
const getDisplayHeight = (d) => {
  const baseHeight = mode.value === 'swell' ? d.swell : d.height
  
  // Scale height by rating - poor conditions = smaller visual
  if (d.rating < 10) return 0.2                           // Flat - tiny
  if (d.rating < 20) return Math.max(0.3, baseHeight * 0.25)  // Very poor
  if (d.rating < 30) return Math.max(0.5, baseHeight * 0.5)   // Poor
  if (d.rating < 40) return Math.max(0.8, baseHeight * 0.7)   // Fair-
  if (d.rating < 50) return baseHeight * 0.85                  // Fair
  return baseHeight                                            // Good+
}

const render = () => {
  if (!chart.value || !data.value.length) return
  
  d3.select(chart.value).selectAll('*').remove()
  
  const margin = { top: 10, right: 10, bottom: 25, left: 30 }
  const box = chart.value.getBoundingClientRect()
  const W = box.width - margin.left - margin.right
  const H = box.height - margin.top - margin.bottom
  
  const svg = d3.select(chart.value)
    .append('svg')
    .attr('width', box.width)
    .attr('height', box.height)
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  const vals = data.value.map(d => getDisplayHeight(d))
  const maxY = 15  // Fixed 15ft max
  
  const x = d3.scaleLinear().domain([0, data.value.length - 1]).range([0, W])
  const y = d3.scaleLinear().domain([0, maxY]).range([H, 0])
  
  // Find "now" index
  const now = Date.now()
  let nowIndex = data.value.findIndex(d => d.date.getTime() > now)
  if (nowIndex === -1) nowIndex = data.value.length
  if (nowIndex === 0) nowIndex = 0.5 // If first point is in future, put line at start
  
  // Grid
  g.append('g')
    .selectAll('line')
    .data(y.ticks(4))
    .join('line')
    .attr('x1', 0).attr('x2', W)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', '#e5e7eb')
  
  // Y labels
  g.append('g')
    .selectAll('text')
    .data(y.ticks(4))
    .join('text')
    .attr('x', -5).attr('y', d => y(d))
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('font-size', 10)
    .attr('fill', '#999')
    .text(d => d + 'ft')
  
  // Day markers - check width to avoid overlap
  const days = data.value.filter((d, i) => i === 0 || d.hour === 0)
  const isMobile = W < 400
  
  days.forEach((d, idx) => {
    // Skip first label if it's not midnight (day already started)
    const isFirstPartialDay = idx === 0 && d.hour !== 0
    
    if (d.i > 0) {
      g.append('line')
        .attr('x1', x(d.i)).attr('x2', x(d.i))
        .attr('y1', 0).attr('y2', H)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
    }
    
    // Skip label for partial first day
    if (isFirstPartialDay) return
    
    // On mobile, only show just the day number
    const label = isMobile ? d.day.charAt(0) + d.dayNum : `${d.day} ${d.dayNum}`
    
    g.append('text')
      .attr('x', x(d.i) + 3)
      .attr('y', H + 16)
      .attr('font-size', isMobile ? 9 : 11)
      .attr('font-weight', 700)
      .attr('fill', '#333')
      .text(label)
  })
  
  // Draw segments between each pair of points
  for (let i = 0; i < data.value.length - 1; i++) {
    const d0 = data.value[i]
    const d1 = data.value[i + 1]
    const avgRating = (d0.rating + d1.rating) / 2
    
    // Check if this segment is in the past
    const isPast = i < nowIndex - 1
    
    const segmentArea = d3.area()
      .x(d => x(d.i))
      .y0(H)
      .y1(d => y(getDisplayHeight(d)))
      .curve(d3.curveBasis)
    
    g.append('path')
      .datum([d0, d1])
      .attr('d', segmentArea)
      .attr('fill', isPast ? '#d1d5db' : color(avgRating))  // Gray out past
      .attr('opacity', isPast ? 0.5 : 0.85)
  }
  
  // Top line
  const line = d3.line()
    .x(d => x(d.i))
    .y(d => y(getDisplayHeight(d)))
    .curve(d3.curveBasis)
  
  g.append('path')
    .datum(data.value)
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', '#000')
    .attr('stroke-width', 1.5)
  
  // "NOW" indicator line
  if (nowIndex > 0 && nowIndex < data.value.length) {
    const nowX = x(nowIndex - 0.5)  // Between previous and next hour
    
    g.append('line')
      .attr('x1', nowX).attr('x2', nowX)
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
    
    // Now dot/label at top
    g.append('circle')
      .attr('cx', nowX)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
  }
  
  // Hover line
  const hoverLine = g.append('line')
    .attr('y1', 0).attr('y2', H)
    .attr('stroke', '#000')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,2')
    .style('display', 'none')
  
  const hoverDot = g.append('circle')
    .attr('r', 5)
    .attr('fill', '#000')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('display', 'none')
  
  // Overlay
  svg.append('rect')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .attr('width', W)
    .attr('height', H)
    .attr('fill', 'transparent')
    .on('mousemove', function(event) {
      const [mx] = d3.pointer(event)
      const idx = Math.round(x.invert(mx))
      const d = data.value[Math.max(0, Math.min(idx, data.value.length - 1))]
      if (!d) return
      
      const px = x(d.i)
      const py = y(getDisplayHeight(d))
      
      hoverLine.attr('x1', px).attr('x2', px).style('display', null)
      hoverDot.attr('cx', px).attr('cy', py).attr('fill', color(d.rating)).style('display', null)
      
      hovered.value = {
        label: d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric' }),
        height: mode.value === 'swell' ? d.swell : d.height,
        swell: `${d.swell}ft @ ${d.period}s ${d.swellDir}`,
        wind: `${d.windSpd}mph ${d.windDir}`,
        tide: getTideHeight(d.date.getTime()),
        tideState: getTideState(d.date.getTime())
      }
      
      // Emit hover event with timestamp for tide graph sync
      emit('hover', d.date.getTime())
    })
    .on('mouseleave', () => {
      hoverLine.style('display', 'none')
      hoverDot.style('display', 'none')
      hovered.value = null
      emit('hoverEnd')
    })
}

watch(() => props.forecasts, () => nextTick(render), { deep: true })

onMounted(() => {
  nextTick(render)
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
})
</script>
