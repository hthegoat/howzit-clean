<template>
  <BrutalCard v-if="day && hourlyData?.length" class="p-4 sm:p-6">
    <p class="text-card-title mb-4">{{ day.dayName }} Hourly</p>
    
    <!-- Combined Wave + Conditions Chart -->
    <div class="mb-4">
      <div class="h-40 overflow-hidden">
        <canvas ref="chartRef"></canvas>
      </div>
      
      <!-- Legend -->
      <div class="flex justify-center gap-4 mt-3 text-xs">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-green-500"></span>
          <span>Good+</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-lime-400"></span>
          <span>Fair+</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-yellow-400"></span>
          <span>Fair</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-orange-400"></span>
          <span>Poor</span>
        </div>
      </div>
    </div>
    
    <!-- Wind Row -->
    <div>
      <p class="text-section mb-2">Wind Details</p>
      <div class="overflow-x-auto pb-2">
        <div class="flex gap-2">
          <div 
            v-for="hour in hourlyData" 
            :key="hour.hour"
            class="flex flex-col items-center min-w-[40px] flex-shrink-0"
          >
            <Windarrow :degrees="hour.windDirection" :speed="hour.windSpeed" :beach-orientation="beachOrientation" class="w-5 h-5" />
            <span class="text-meta mt-1">{{ hour.windSpeed }}</span>
            <span class="text-meta">{{ formatHour(hour.hour) }}</span>
          </div>
        </div>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const { calculateRating, scoreToColor } = useHowzitRating()

const props = defineProps({
  day: { type: Object, default: null },
  hourlyData: { type: Array, default: () => [] },
  beachOrientation: { type: Number, default: 90 }
})

const chartRef = ref(null)
let chart = null

const formatHour = (hour) => {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? 'a' : 'p'
  return `${h}${ampm}`
}

const renderChart = () => {
  if (!chartRef.value || !props.hourlyData?.length) return
  
  if (chart) chart.destroy()
  
  const ctx = chartRef.value.getContext('2d')
  const labels = props.hourlyData.map(h => formatHour(h.hour))
  const data = props.hourlyData.map(h => parseFloat(h.waveHeight) || 0)
  
  // Calculate Howzit score for each hour and get color
  const colors = props.hourlyData.map(h => {
    const score = calculateRating({
      waveHeight: parseFloat(h.waveHeight) || 0,
      wavePeriod: h.wavePeriod,
      windSpeed: h.windSpeed,
      windDirection: h.windDirection,
      beachOrientation: props.beachOrientation
    })
    return scoreToColor(score)
  })
  
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 3,
        barPercentage: 0.9,
        categoryPercentage: 0.95,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#000',
          titleFont: { weight: 'bold' },
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex
              const hour = props.hourlyData[idx]
              const score = calculateRating({
                waveHeight: parseFloat(hour.waveHeight) || 0,
                wavePeriod: hour.wavePeriod,
                windSpeed: hour.windSpeed,
                windDirection: hour.windDirection,
                beachOrientation: props.beachOrientation
              })
              const { scoreToLabel } = useHowzitRating()
              return `${formatHour(hour.hour)} - ${scoreToLabel(score)}`
            },
            label: (item) => {
              const idx = item.dataIndex
              const hour = props.hourlyData[idx]
              return [
                `Waves: ${item.raw}ft`,
                `Wind: ${hour.windSpeed}mph`,
                `Period: ${hour.wavePeriod || '--'}s`
              ]
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          grid: { color: '#e5e7eb' },
          ticks: { 
            stepSize: 2,
            callback: (val) => val + 'ft' 
          }
        },
        x: {
          grid: { display: false },
          ticks: { 
            maxRotation: 0,
            font: { size: 10 }
          }
        }
      }
    }
  })
}

watch(() => props.hourlyData, async () => {
  await nextTick()
  renderChart()
}, { immediate: true })

onMounted(() => nextTick(() => renderChart()))
</script>
