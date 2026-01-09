<template>
  <div class="bg-white border-2 border-black rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center px-4 py-3 border-b-2 border-black">
      <h3 class="font-black uppercase">Tide Forecast</h3>
    </div>

    <!-- Chart -->
    <div class="p-4">
      <div ref="chart" class="w-full" style="height: 120px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  tides: { type: Array, default: () => [] },
  forecasts: { type: Array, default: () => [] },
  hoverTime: { type: Number, default: null }
})

const chart = ref(null)

// Store references for hover updates
let xScale = null
let yScale = null
let allTidesRef = []
let hoverLine = null
let hoverDot = null
let chartHeight = 0

const render = () => {
  if (!chart.value || !props.tides.length) return
  
  d3.select(chart.value).selectAll('*').remove()
  
  // Get forecast time range
  const forecastTimes = props.forecasts.map(f => new Date(f.timestamp).getTime())
  if (!forecastTimes.length) return
  
  const startTime = Math.min(...forecastTimes)
  const endTime = Math.max(...forecastTimes)
  
  // Sort tides and get relevant ones (plus buffer for interpolation)
  allTidesRef = props.tides
    .map(t => ({ ...t, time: new Date(t.timestamp).getTime() }))
    .sort((a, b) => a.time - b.time)
  
  if (allTidesRef.length < 2) return
  
  const margin = { top: 10, right: 10, bottom: 25, left: 30 }
  const box = chart.value.getBoundingClientRect()
  const W = box.width - margin.left - margin.right
  const H = box.height - margin.top - margin.bottom
  chartHeight = H
  
  const svg = d3.select(chart.value)
    .append('svg')
    .attr('width', box.width)
    .attr('height', box.height)
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  // Generate tide curve data points (every 30 min)
  const curveData = []
  const interval = 30 * 60 * 1000 // 30 minutes
  
  for (let t = startTime; t <= endTime; t += interval) {
    const height = interpolateTideHeight(t, allTidesRef)
    curveData.push({ time: t, height })
  }
  
  // Scales - store for hover updates
  xScale = d3.scaleTime()
    .domain([startTime, endTime])
    .range([0, W])
  
  const heights = curveData.map(d => d.height)
  const minH = Math.floor(Math.min(...heights, 0))
  const maxH = Math.ceil(Math.max(...heights, 6))
  
  yScale = d3.scaleLinear()
    .domain([minH, maxH])
    .range([H, 0])
  
  // Grid lines
  g.append('g')
    .selectAll('line')
    .data(yScale.ticks(4))
    .join('line')
    .attr('x1', 0).attr('x2', W)
    .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
    .attr('stroke', '#e5e7eb')
  
  // Y axis labels
  g.append('g')
    .selectAll('text')
    .data(yScale.ticks(4))
    .join('text')
    .attr('x', -5).attr('y', d => yScale(d))
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('font-size', 10)
    .attr('fill', '#999')
    .text(d => d + 'ft')
  
  // Day markers
  const days = []
  let currentDay = new Date(startTime)
  currentDay.setHours(0, 0, 0, 0)
  
  while (currentDay.getTime() <= endTime) {
    if (currentDay.getTime() >= startTime) {
      days.push(new Date(currentDay))
    }
    currentDay.setDate(currentDay.getDate() + 1)
  }
  
  const isMobile = W < 400
  
  days.forEach((d, idx) => {
    const px = xScale(d.getTime())
    if (px > 0 && px < W) {
      g.append('line')
        .attr('x1', px).attr('x2', px)
        .attr('y1', 0).attr('y2', H)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
    }
    
    const label = isMobile 
      ? d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0) + d.getDate()
      : d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.getDate()
    
    g.append('text')
      .attr('x', px + 3)
      .attr('y', H + 16)
      .attr('font-size', isMobile ? 9 : 11)
      .attr('font-weight', 700)
      .attr('fill', '#333')
      .text(label)
  })
  
  // Area fill
  const area = d3.area()
    .x(d => xScale(d.time))
    .y0(H)
    .y1(d => yScale(d.height))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .datum(curveData)
    .attr('d', area)
    .attr('fill', '#3b82f6')
    .attr('opacity', 0.3)
  
  // Line
  const line = d3.line()
    .x(d => xScale(d.time))
    .y(d => yScale(d.height))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .datum(curveData)
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 2)
  
  // Hover line and dot (hidden by default)
  hoverLine = g.append('line')
    .attr('y1', 0).attr('y2', H)
    .attr('stroke', '#000')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,2')
    .style('display', 'none')
  
  hoverDot = g.append('circle')
    .attr('r', 5)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('display', 'none')
  
  // Now marker
  const now = Date.now()
  if (now >= startTime && now <= endTime) {
    const nowX = xScale(now)
    const nowHeight = interpolateTideHeight(now, allTidesRef)
    
    g.append('line')
      .attr('x1', nowX).attr('x2', nowX)
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
    
    g.append('circle')
      .attr('cx', nowX)
      .attr('cy', yScale(nowHeight))
      .attr('r', 4)
      .attr('fill', '#ef4444')
  }
  
  // Update hover if already active
  if (props.hoverTime) {
    updateHover(props.hoverTime)
  }
}

const updateHover = (timeMs) => {
  if (!xScale || !yScale || !hoverLine || !hoverDot) return
  
  const domain = xScale.domain()
  if (timeMs < domain[0].getTime() || timeMs > domain[1].getTime()) {
    hoverLine.style('display', 'none')
    hoverDot.style('display', 'none')
    return
  }
  
  const px = xScale(timeMs)
  const height = interpolateTideHeight(timeMs, allTidesRef)
  const py = yScale(height)
  
  hoverLine.attr('x1', px).attr('x2', px).style('display', null)
  hoverDot.attr('cx', px).attr('cy', py).style('display', null)
}

const hideHover = () => {
  if (hoverLine) hoverLine.style('display', 'none')
  if (hoverDot) hoverDot.style('display', 'none')
}

const interpolateTideHeight = (timeMs, tides) => {
  // Find the two surrounding tides
  let before = null
  let after = null
  
  for (let i = 0; i < tides.length; i++) {
    if (tides[i].time <= timeMs) before = tides[i]
    if (tides[i].time > timeMs && !after) after = tides[i]
  }

  if (!before && !after) return 3
  if (!before) return after.height
  if (!after) return before.height
  
  const duration = after.time - before.time
  if (duration <= 0) return before.height
  
  // Use a smoother sine-based interpolation
  // This creates a more natural tidal curve
  const t = (timeMs - before.time) / duration
  
  // Sine interpolation gives a smoother, more natural tidal curve
  const smoothT = (Math.sin((t - 0.5) * Math.PI) + 1) / 2
  
  return before.height + (after.height - before.height) * smoothT
}

// Watch for hover time changes from surf graph
watch(() => props.hoverTime, (newTime) => {
  if (newTime) {
    updateHover(newTime)
  } else {
    hideHover()
  }
})

watch([() => props.tides, () => props.forecasts], () => nextTick(render), { deep: true })

onMounted(() => {
  nextTick(render)
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
})
</script>
