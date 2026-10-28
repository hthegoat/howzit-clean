<template>
  <BrutalCard v-if="buoyId" class="p-4 sm:p-5">
    <div class="flex justify-between items-baseline mb-3">
      <p class="text-card-title">Buoy Check</p>
      <a
        :href="`https://www.ndbc.noaa.gov/station_page.php?station=${buoyId}`"
        target="_blank"
        rel="noopener"
        class="text-[11px] text-gray-400 font-mono hover:text-black hover:underline"
      >NDBC {{ buoyId }}</a>
    </div>

    <!-- Wave sensor offline -->
    <p v-if="!hasWaveData" class="text-sm font-bold uppercase text-gray-400">
      Wave sensor offline — no check available
    </p>

    <!-- Stale reading -->
    <p v-else-if="isStale" class="text-sm font-bold uppercase text-gray-400">
      Last reading {{ ageLabel }} old — too stale to check
    </p>

    <!-- Comparison -->
    <div v-else>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[10px] uppercase tracking-wider text-gray-400">
            <th class="text-left font-bold pb-1.5"></th>
            <th class="text-right font-bold pb-1.5">FT</th>
            <th class="text-right font-bold pb-1.5">SEC</th>
            <th class="text-right font-bold pb-1.5">MISS</th>
          </tr>
        </thead>
        <tbody class="font-mono">
          <tr class="border-t-2 border-black bg-yellow-50">
            <td class="py-1.5 font-sans font-black uppercase text-xs">Buoy</td>
            <td class="text-right font-bold">{{ buoyHeightFt.toFixed(1) }}</td>
            <td class="text-right font-bold">{{ buoyPeriod ? Math.round(buoyPeriod) : '--' }}</td>
            <td class="text-right text-gray-300">—</td>
          </tr>
          <tr v-for="row in modelRows" :key="row.label" class="border-t border-gray-200">
            <td class="py-1.5 font-sans font-bold uppercase text-xs text-gray-500">{{ row.label }}</td>
            <td class="text-right">{{ row.height != null ? row.height.toFixed(1) : '--' }}</td>
            <td class="text-right">{{ row.period != null ? Math.round(row.period) : '--' }}</td>
            <td class="text-right" :class="deltaClass(row.delta)">{{ formatDelta(row.delta) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-3 pt-2 border-t-2 border-black flex justify-between items-center font-mono text-[11px] uppercase">
        <span class="font-bold">
          <template v-if="verdict === 'on'">Blend on target</template>
          <template v-else-if="verdict === 'hot'">Blend +{{ Math.abs(blendDelta).toFixed(1) }}ft hot</template>
          <template v-else-if="verdict === 'cold'">Blend −{{ Math.abs(blendDelta).toFixed(1) }}ft cold</template>
        </span>
        <span class="text-gray-400">{{ ageLabel }} ago</span>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  buoy: { type: Object, default: null },
  forecasts: { type: Array, default: () => [] },
  buoyId: { type: String, default: null }
})

const M_TO_FT = 3.281
const STALE_MINUTES = 360 // 6h — beyond this the comparison is unfair

const hasWaveData = computed(() => props.buoy?.wave_height != null)

const ageMinutes = computed(() => {
  if (!props.buoy?.timestamp) return Infinity
  return Math.max(0, Math.round((Date.now() - new Date(props.buoy.timestamp).getTime()) / 60000))
})

const isStale = computed(() => ageMinutes.value > STALE_MINUTES)

const ageLabel = computed(() => {
  const m = ageMinutes.value
  if (!isFinite(m)) return '--'
  if (m < 60) return `${m} min`
  const h = Math.round(m / 60)
  return `${h}h`
})

const buoyHeightFt = computed(() => (props.buoy?.wave_height ?? 0) * M_TO_FT)
const buoyPeriod = computed(() => props.buoy?.dominant_period ?? props.buoy?.average_period ?? null)

// Forecast row closest to the buoy reading (forecasts are ascending from now)
const matchedForecast = computed(() => {
  if (!props.forecasts.length || !props.buoy?.timestamp) return props.forecasts[0] || null
  const t = new Date(props.buoy.timestamp).getTime()
  let best = props.forecasts[0]
  let bestDiff = Infinity
  for (const f of props.forecasts) {
    const diff = Math.abs(new Date(f.timestamp).getTime() - t)
    if (diff < bestDiff) { bestDiff = diff; best = f } else { break } // ascending → diffs only grow after minimum
  }
  return best
})

const toFt = (m) => (m == null ? null : m * M_TO_FT)

const modelRows = computed(() => {
  const f = matchedForecast.value
  if (!f) return []
  const rows = [
    { label: 'Open-Meteo', height: toFt(f.wave_height), period: f.wave_period },
    { label: 'WW3', height: toFt(f.ww3_wave_height), period: f.ww3_wave_period },
    { label: 'ECMWF', height: toFt(f.ecmwf_wave_height), period: f.ecmwf_wave_period },
    { label: 'Blend', height: toFt(f.blended_wave_height), period: f.blended_wave_period }
  ]
  return rows.map(r => ({
    ...r,
    delta: r.height != null ? r.height - buoyHeightFt.value : null
  }))
})

const blendDelta = computed(() => {
  const blend = modelRows.value.find(r => r.label === 'Blend')
  return blend?.delta ?? null
})

const verdict = computed(() => {
  const d = blendDelta.value
  if (d == null) return null
  if (Math.abs(d) <= 0.5) return 'on'
  return d > 0 ? 'hot' : 'cold'
})

const formatDelta = (d) => {
  if (d == null) return '--'
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(1)}`
}

const deltaClass = (d) => {
  if (d == null) return 'text-gray-300'
  return Math.abs(d) <= 0.5 ? 'text-gray-500' : 'font-bold text-black'
}
</script>
