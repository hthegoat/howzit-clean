<template>
  <div class="w-full h-full relative overflow-hidden">
    <canvas ref="chartCanvas"></canvas>
    <div 
      v-if="showNowLine"
      class="absolute top-0 w-0.5 bg-red-500 pointer-events-none z-10"
      :style="{ left: nowLinePosition, height: 'calc(100% - 25px)' }"
    >
      <div class="absolute -top-0.5 -left-[3px] w-2 h-2 bg-red-500 rounded-full"></div>
      <div class="absolute -bottom-4 -left-3 text-[10px] font-bold text-red-500">NOW</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  tides: { type: Array, default: () => [] }
})

const chartCanvas = ref(null)
let chartInstance = null

const nowLinePosition = computed(() => {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  const percent = (hours / 24) * 100
  return `calc(${percent}% * 0.88 + 45px)`
})

const showNowLine = computed(() => true)

// Get ALL tides sorted (for proper interpolation across day boundaries)
const getAllTidesSorted = (tides) => {
  return (tides || [])
    .map(t => ({ ...t, time: new Date(t.timestamp).getTime() }))
    .sort((a, b) => a.time - b.time)
}

const generateTideCurve = (tides) => {
  const labels = []
  const data = []
  const timeLabels = []
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Use ALL tides for interpolation (not just today's)
  const allTides = getAllTidesSorted(tides)

  if (allTides.length < 2) {
    // Placeholder sine wave
    for (let hour = 0; hour < 24; hour++) {
      labels.push(formatHour(hour))
      timeLabels.push(formatHour(hour))
      data.push(3 + 1.5 * Math.sin((hour / 6) * Math.PI - Math.PI / 2))
    }
    return { labels, data, timeLabels }
  }

  // Generate points every 30 minutes for today only
  for (let i = 0; i < 48; i++) {
    const hour = i / 2
    const minutes = (i % 2) * 30
    const time = new Date(today)
    time.setHours(Math.floor(hour), minutes, 0, 0)
    
    // X-axis labels (show every 4 hours)
    if (i % 8 === 0) {
      labels.push(formatHour(Math.floor(hour)))
    } else {
      labels.push('')
    }
    
    // Time labels for tooltips
    const h = Math.floor(hour)
    const m = minutes
    const ampm = h < 12 ? 'AM' : 'PM'
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
    timeLabels.push(`${displayH}:${m.toString().padStart(2, '0')} ${ampm}`)
    
    // Interpolate using ALL tides (including tomorrow's)
    data.push(interpolateTideHeight(time.getTime(), allTides))
  }

  return { labels, data, timeLabels }
}

const interpolateTideHeight = (timeMs, tides) => {
  // Find bracketing tides
  let before = null
  let after = null
  
  for (let i = 0; i < tides.length; i++) {
    if (tides[i].time <= timeMs) {
      before = tides[i]
    }
    if (tides[i].time > timeMs && !after) {
      after = tides[i]
    }
  }

  // Edge cases
  if (!before && !after) return 3
  if (!before) return after.height
  if (!after) return before.height

  // Cosine interpolation between the two tides
  const t = (timeMs - before.time) / (after.time - before.time)
  const cosT = (1 - Math.cos(t * Math.PI)) / 2
  
  return before.height + (after.height - before.height) * cosT
}

const formatHour = (hour) => {
  if (hour === 0 || hour === 24) return '12a'
  if (hour === 12) return '12p'
  return hour < 12 ? `${hour}a` : `${hour - 12}p`
}

let timeLabelsRef = []

const createChart = () => {
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()

  const { labels, data, timeLabels } = generateTideCurve(props.tides)
  timeLabelsRef = timeLabels
  const ctx = chartCanvas.value.getContext('2d')

  const minHeight = Math.min(...data)
  const maxHeight = Math.max(...data)
  const yMin = Math.floor(minHeight - 0.5)
  const yMax = Math.ceil(maxHeight + 0.5)

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#000',
        backgroundColor: '#3b82f6',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#000',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: '#000',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 14 },
          padding: 10,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const index = items[0].dataIndex
              return timeLabelsRef[index] || ''
            },
            label: (ctx) => {
              return `${ctx.raw.toFixed(1)} ft`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#6B7280',
            maxRotation: 0,
            autoSkip: false
          }
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: '#E5E7EB' },
          ticks: { 
            font: { size: 10 }, 
            color: '#6B7280', 
            stepSize: 2, 
            callback: (val) => `${val}ft` 
          }
        }
      }
    }
  })
}

onMounted(() => createChart())
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
watch(() => props.tides, () => createChart(), { deep: true })
</script>
