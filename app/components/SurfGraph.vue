<template>
  <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b-2 border-black">
      <h2 class="font-black uppercase">Surf Graph</h2>
      
      <!-- Source Toggle -->
      <div class="flex border-2 border-black rounded overflow-hidden text-sm">
        <button 
          v-for="src in sources" 
          :key="src.id"
          @click="source = src.id; render()" 
          :class="source === src.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
          class="px-2 py-1 font-bold uppercase text-[10px] transition-colors"
          :title="src.title"
        >
          {{ src.label }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="p-4">
      <div ref="chart" class="w-full" style="height: 150px;"></div>

      <!-- Legend -->
      <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs font-medium">
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
        
        <!-- Source indicator -->
        <div v-if="source !== 'blend'" class="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-300">
          <span class="text-gray-500">{{ currentSourceLabel }}</span>
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
        <span v-if="hovered.confidence && source === 'blend'" class="text-xs" :class="confidenceClass(hovered.confidence)">
          {{ hovered.confidence === 'high' ? '✓ High confidence' : hovered.confidence === 'medium' ? '~ Medium' : '? Uncertain' }}
        </span>
      </div>
      
      <!-- Model comparison on hover -->
      <div v-if="hovered.allModels && source === 'blend'" class="flex gap-4 mt-2 text-xs text-gray-500 font-mono">
        <span v-if="hovered.allModels.ww3 !== null">WW3: {{ hovered.allModels.ww3 }}ft</span>
        <span v-if="hovered.allModels.ecmwf !== null">ECMWF: {{ hovered.allModels.ecmwf }}ft</span>
        <span v-if="hovered.allModels.openMeteo !== null">OM: {{ hovered.allModels.openMeteo }}ft</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  forecasts: { type: Array, required: true },
  beachOrientation: { type: Number, default: 90 },
  tides: { type: Array, default: () => [] }
})

const emit = defineEmits(['hover', 'hoverEnd'])

const { calculateRating } = useHowzitRating()

const source = ref('blend')
const chart = ref(null)
const hovered = ref(null)

const sources = [
  { id: 'blend', label: 'Hwzt', title: 'Howzit blend (recommended)' },
  { id: 'ww3', label: 'WW3', title: 'WaveWatch III (NOAA)' },
  { id: 'ecmwf', label: 'ECMWF', title: 'ECMWF WAM (European)' },
  { id: 'om', label: 'OM', title: 'Open-Meteo' },
]

const currentSourceLabel = computed(() => {
  const s = sources.find(s => s.id === source.value)
  return s?.title || ''
})

const confidenceClass = (conf) => {
  if (conf === 'high') return 'text-emerald-600'
  if (conf === 'medium') return 'text-amber-600'
  return 'text-red-500'
}

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
  
  const nextTide = sortedTides.find(t => t.time > timeMs)
  if (!nextTide) return null
  
  return nextTide.type === 'HIGH' ? 'Rising' : 'Falling'
}

// Get wave height based on selected source
const getWaveHeight = (f) => {
  switch (source.value) {
    case 'ww3': return f.ww3_wave_height
    case 'ecmwf': return f.ecmwf_wave_height
    case 'om': return f.wave_height
    case 'blend':
    default: return f.blended_wave_height ?? f.wave_height
  }
}

const getWavePeriod = (f) => {
  switch (source.value) {
    case 'ww3': return f.ww3_wave_period
    case 'ecmwf': return f.ecmwf_wave_period
    case 'om': return f.wave_period
    case 'blend':
    default: return f.blended_wave_period ?? f.wave_period
  }
}

const getWaveDirection = (f) => {
  switch (source.value) {
    case 'ww3': return f.ww3_wave_direction
    case 'ecmwf': return f.ecmwf_wave_direction
    case 'om': return f.wave_direction
    case 'blend':
    default: return f.blended_wave_direction ?? f.wave_direction
  }
}

const data = computed(() => {
  return props.forecasts.map((f, i) => {
    const date = new Date(f.timestamp)
    const toFt = m => m ? +(m * 3.281).toFixed(1) : 0
    const toMph = k => k ? Math.round(k * 0.621) : 0
    
    const waveHeight = getWaveHeight(f)
    const wavePeriod = getWavePeriod(f)
    const waveDirection = getWaveDirection(f)
    
    const rating = calculateRating({
      waveHeight,
      wavePeriod,
      waveDirection,
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
      height: toFt(waveHeight),
      swell: toFt(f.swell_wave_height),
      period: Math.round(f.swell_wave_period) || 0,
      swellDir: dir(f.swell_wave_direction),
      windSpd: toMph(f.wind_speed),
      windDir: dir(f.wind_direction),
      rating,
      confidence: f.blend_confidence,
      // Store all model values for comparison
      allModels: {
        ww3: f.ww3_wave_height ? toFt(f.ww3_wave_height) : null,
        ecmwf: f.ecmwf_wave_height ? toFt(f.ecmwf_wave_height) : null,
        openMeteo: f.wave_height ? toFt(f.wave_height) : null
      }
    }
  })
})

const color = r => {
  if (r >= 55) return '#10b981'
  if (r >= 35) return '#3b82f6'
  if (r >= 10) return '#fb7185'
  return '#d1d5db'
}

const getDisplayHeight = (d) => {
  const baseHeight = d.height
  
  if (d.rating < 10) return 0.2
  if (d.rating < 20) return Math.max(0.3, baseHeight * 0.25)
  if (d.rating < 30) return Math.max(0.5, baseHeight * 0.5)
  if (d.rating < 40) return Math.max(0.8, baseHeight * 0.7)
  if (d.rating < 50) return baseHeight * 0.85
  return baseHeight
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
  
  const maxY = 15
  
  const x = d3.scaleLinear().domain([0, data.value.length - 1]).range([0, W])
  const y = d3.scaleLinear().domain([0, maxY]).range([H, 0])
  
  const now = Date.now()
  let nowIndex = data.value.findIndex(d => d.date.getTime() > now)
  if (nowIndex === -1) nowIndex = data.value.length
  if (nowIndex === 0) nowIndex = 0.5
  
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
  
  // Day markers
  const days = data.value.filter((d, i) => i === 0 || d.hour === 0)
  const isMobile = W < 400
  
  days.forEach((d, idx) => {
    const isFirstPartialDay = idx === 0 && d.hour !== 0
    
    if (d.i > 0) {
      g.append('line')
        .attr('x1', x(d.i)).attr('x2', x(d.i))
        .attr('y1', 0).attr('y2', H)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
    }
    
    if (isFirstPartialDay) return
    
    const label = isMobile ? d.day.charAt(0) + d.dayNum : `${d.day} ${d.dayNum}`
    
    g.append('text')
      .attr('x', x(d.i) + 3)
      .attr('y', H + 16)
      .attr('font-size', isMobile ? 9 : 11)
      .attr('font-weight', 700)
      .attr('fill', '#333')
      .text(label)
  })
  
  // Draw segments
  for (let i = 0; i < data.value.length - 1; i++) {
    const d0 = data.value[i]
    const d1 = data.value[i + 1]
    const avgRating = (d0.rating + d1.rating) / 2
    const isPast = i < nowIndex - 1
    
    const segmentArea = d3.area()
      .x(d => x(d.i))
      .y0(H)
      .y1(d => y(getDisplayHeight(d)))
      .curve(d3.curveBasis)
    
    g.append('path')
      .datum([d0, d1])
      .attr('d', segmentArea)
      .attr('fill', isPast ? '#d1d5db' : color(avgRating))
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
  
  // NOW indicator
  if (nowIndex > 0 && nowIndex < data.value.length) {
    const nowX = x(nowIndex - 0.5)
    
    g.append('line')
      .attr('x1', nowX).attr('x2', nowX)
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
    
    g.append('circle')
      .attr('cx', nowX)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
  }
  
  // Hover elements
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
        height: d.height,
        swell: `${d.swell}ft @ ${d.period}s ${d.swellDir}`,
        wind: `${d.windSpd}mph ${d.windDir}`,
        tide: getTideHeight(d.date.getTime()),
        tideState: getTideState(d.date.getTime()),
        confidence: d.confidence,
        allModels: d.allModels
      }
      
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
watch(source, () => nextTick(render))

onMounted(() => {
  nextTick(render)
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
})
</script>
