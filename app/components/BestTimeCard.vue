<template>
  <BrutalCard v-if="bestWindow" class="p-4 sm:p-6 bg-green-50">
    <div class="flex items-start gap-3">
      <div class="text-2xl">🏄</div>
      <div>
        <p class="text-card-title mb-1">Best Time to Surf Today</p>
        <p class="text-xl sm:text-2xl font-black">{{ bestWindow.timeRange }}</p>
        <p class="text-sm text-gray-600 mt-1">{{ bestWindow.reason }}</p>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hourlyData: { type: Array, default: () => [] },
  tides: { type: Array, default: () => [] },
  beachOrientation: { type: Number, default: 90 }
})

const { calculateRating, scoreToLabel } = useHowzitRating()

const bestWindow = computed(() => {
  if (!props.hourlyData?.length) return null
  
  // Score each hour
  const scored = props.hourlyData.map(h => {
    const waveHt = typeof h.waveHeight === 'string' ? parseFloat(h.waveHeight) : (h.waveHeight || 0)
    const wavePd = typeof h.wavePeriod === 'string' ? parseFloat(h.wavePeriod) : h.wavePeriod
    
    const score = calculateRating({
      waveHeight: waveHt,
      wavePeriod: wavePd,
      windSpeed: h.windSpeed,
      windDirection: h.windDirection,
      beachOrientation: props.beachOrientation
    })
    
    return { ...h, score, waveHt, wavePd }
  })
  
  // Find the best consecutive window (at least 2 hours)
  let bestStart = 0
  let bestEnd = 0
  let bestAvgScore = 0
  
  for (let i = 0; i < scored.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 6, scored.length); j++) {
      const window = scored.slice(i, j + 1)
      const avgScore = window.reduce((sum, h) => sum + h.score, 0) / window.length
      
      if (avgScore > bestAvgScore) {
        bestAvgScore = avgScore
        bestStart = i
        bestEnd = j
      }
    }
  }
  
  if (bestAvgScore < 15) return null // No good windows
  
  const startHour = scored[bestStart]
  const endHour = scored[bestEnd]
  
  const formatHour = (hour) => {
    const h = hour % 12 || 12
    const ampm = hour < 12 ? 'AM' : 'PM'
    return `${h}${ampm}`
  }
  
  const timeRange = `${formatHour(startHour.hour)} - ${formatHour(endHour.hour + 1)}`
  
  // Build reason
  const reasons = []
  const avgWind = scored.slice(bestStart, bestEnd + 1).reduce((sum, h) => sum + (h.windSpeed || 0), 0) / (bestEnd - bestStart + 1)
  
  // Wind quality
  if (startHour.windDirection !== null) {
    const offshoreDir = (props.beachOrientation + 180) % 360
    let diff = Math.abs(startHour.windDirection - offshoreDir)
    if (diff > 180) diff = 360 - diff
    
    if (diff <= 30) reasons.push('offshore winds')
    else if (diff <= 60) reasons.push('cross-off winds')
    else if (diff <= 90) reasons.push('light cross winds')
  }
  
  if (avgWind < 8) reasons.push('light wind')
  
  // Tide context
  const today = new Date().toDateString()
  const todayTides = (props.tides || [])
    .filter(t => new Date(t.timestamp).toDateString() === today)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  if (todayTides.length) {
    const windowStart = new Date()
    windowStart.setHours(startHour.hour, 0, 0, 0)
    const windowEnd = new Date()
    windowEnd.setHours(endHour.hour + 1, 0, 0, 0)
    
    // Find tide during window
    const tideInWindow = todayTides.find(t => {
      const tideTime = new Date(t.timestamp)
      return tideTime >= windowStart && tideTime <= windowEnd
    })
    
    if (tideInWindow) {
      reasons.push(`${tideInWindow.type.toLowerCase()} tide`)
    } else {
      // Determine if rising or falling during window
      const nextTide = todayTides.find(t => new Date(t.timestamp) > windowStart)
      if (nextTide) {
        reasons.push(nextTide.type === 'HIGH' ? 'incoming tide' : 'outgoing tide')
      }
    }
  }
  
  const label = scoreToLabel(bestAvgScore)
  const reason = reasons.length ? `${label} conditions with ${reasons.join(', ')}` : `${label} conditions`
  
  return { timeRange, reason }
})
</script>
