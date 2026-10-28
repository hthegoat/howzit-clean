<template>
  <div
    v-if="points.length > 2"
    class="bg-white border-2 border-black rounded-[var(--radius)] shadow-[4px_4px_0px_#000] p-4 sm:p-5"
  >
    <div class="flex items-center justify-between gap-3 mb-1">
      <div class="flex items-center gap-2 min-w-0">
        <h2 class="text-lg sm:text-xl font-black truncate">Model agreement</h2>
        <button
          type="button"
          @click="showInfo = !showInfo"
          :aria-expanded="showInfo"
          aria-label="How to read this chart"
          class="w-5 h-5 shrink-0 flex items-center justify-center rounded-full border-2 border-black text-[11px] font-black leading-none transition-colors"
          :class="showInfo ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
        >i</button>
      </div>
      <span class="text-xs font-black uppercase tracking-wide shrink-0" :style="{ color: verdict.color }">
        {{ verdict.label }}
      </span>
    </div>

    <p class="text-xs text-gray-500 mb-4">
      Band is the full range across Open-Meteo, WW3 and ECMWF. Line is the blend.
    </p>

    <div
      v-if="showInfo"
      class="mb-4 border-2 border-black rounded-[var(--radius)] bg-gray-50 p-3 space-y-2"
    >
      <p class="text-xs leading-relaxed">
        Most forecasts show one line and never tell you how sure they are. We pull three
        separate wave models &mdash; Open-Meteo, WaveWatch III and ECMWF &mdash; and draw the
        gap between the highest and lowest as the yellow band. The black line is our blend.
      </p>
      <p class="text-xs leading-relaxed">
        <span class="font-black">Narrow band:</span> the models agree, so the call is solid.
        <span class="font-black">Wide band:</span> they don't, and the number is a rough guess.
      </p>
      <p class="text-xs leading-relaxed text-gray-500">
        The band always widens further out. That's forecasting, not a bug &mdash; nobody knows
        what Saturday looks like as well as they know today.
      </p>
    </div>

    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" :aria-label="ariaLabel">
      <line
        v-for="g in gridlines"
        :key="`g${g.v}`"
        :x1="PAD_L" :y1="g.y" :x2="W - PAD_R" :y2="g.y"
        stroke="#000" stroke-width="1" :opacity="g.v === 0 ? 0.9 : 0.12"
      />

      <path :d="bandPath" fill="#FACC15" fill-opacity="0.55" stroke="none" />
      <path :d="upperPath" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="3 3" opacity="0.45" />
      <path :d="lowerPath" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="3 3" opacity="0.45" />
      <path :d="blendPath" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

      <line
        v-for="d in dayTicks"
        :key="`d${d.x}`"
        :x1="d.x" :y1="PAD_T" :x2="d.x" :y2="H - PAD_B"
        stroke="#000" stroke-width="1" opacity="0.15"
      />

      <text
        v-for="g in gridlines"
        :key="`gl${g.v}`"
        :x="PAD_L - 6" :y="g.y + 4"
        text-anchor="end" font-size="11" font-weight="700" fill="#6b7280"
      >{{ g.v }}</text>

      <text
        v-for="d in dayTicks"
        :key="`dl${d.x}`"
        :x="d.x + 5" :y="H - PAD_B + 16"
        font-size="11" font-weight="700" fill="#6b7280"
      >{{ d.label }}</text>
    </svg>

    <div class="mt-4 pt-3 border-t-2 border-black grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-lg font-black leading-none">{{ spreadNow }}<span class="text-xs">ft</span></p>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1">Spread now</p>
      </div>
      <div>
        <p class="text-lg font-black leading-none">{{ spreadEnd }}<span class="text-xs">ft</span></p>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1">Spread day 7</p>
      </div>
      <div>
        <p class="text-lg font-black leading-none">{{ modelCount }}</p>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1">Models</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  forecasts: { type: Array, default: () => [] }
})

const W = 700
const H = 230
const PAD_L = 34
const PAD_R = 10
const PAD_T = 14
const PAD_B = 34

const showInfo = ref(false)

const M_TO_FT = 3.281

// One point every 3 hours. Hourly resolution is more detail than the eye
// resolves at this width and makes the path needlessly heavy.
const points = computed(() => {
  const out = []
  for (const f of props.forecasts) {
    const t = new Date(f.timestamp)
    if (t.getUTCHours() % 3 !== 0) continue

    const models = [f.wave_height, f.ww3_wave_height, f.ecmwf_wave_height]
      .filter(v => v != null && !isNaN(v))
    if (models.length < 2) continue

    const blend = f.blended_wave_height ?? f.wave_height
    if (blend == null) continue

    out.push({
      t,
      lo: Math.min(...models) * M_TO_FT,
      hi: Math.max(...models) * M_TO_FT,
      blend: blend * M_TO_FT,
      n: models.length
    })
  }
  return out
})

const maxFt = computed(() => {
  const hi = Math.max(...points.value.map(p => p.hi), 2)
  return Math.max(3, Math.ceil(hi * 1.1))
})

const xFor = (i) => {
  const n = points.value.length
  if (n < 2) return PAD_L
  return PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R)
}

const yFor = (v) => {
  const top = PAD_T
  const bottom = H - PAD_B
  return bottom - (v / maxFt.value) * (bottom - top)
}

const upperPath = computed(() =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(p.hi).toFixed(1)}`).join(' ')
)

const lowerPath = computed(() =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(p.lo).toFixed(1)}`).join(' ')
)

const blendPath = computed(() =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(p.blend).toFixed(1)}`).join(' ')
)

const bandPath = computed(() => {
  const pts = points.value
  if (pts.length < 2) return ''
  const up = pts.map((p, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(p.hi).toFixed(1)}`).join(' ')
  const down = pts
    .map((p, i) => ({ x: xFor(i), y: yFor(p.lo) }))
    .reverse()
    .map(c => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ')
  return `${up} ${down} Z`
})

const gridlines = computed(() => {
  const step = Math.max(1, Math.ceil(maxFt.value / 4))
  const lines = []
  for (let v = 0; v <= maxFt.value; v += step) {
    lines.push({ v, y: yFor(v) })
  }
  return lines
})

const dayTicks = computed(() => {
  const out = []
  let last = null
  points.value.forEach((p, i) => {
    const key = p.t.toDateString()
    if (key !== last) {
      last = key
      if (i > 0) {
        out.push({
          x: xFor(i),
          label: p.t.toLocaleDateString('en-US', { weekday: 'short' })
        })
      }
    }
  })
  return out
})

const spreadNow = computed(() => {
  const p = points.value[0]
  return p ? (p.hi - p.lo).toFixed(1) : '0.0'
})

const spreadEnd = computed(() => {
  const p = points.value[points.value.length - 1]
  return p ? (p.hi - p.lo).toFixed(1) : '0.0'
})

const modelCount = computed(() => {
  if (!points.value.length) return 0
  return Math.max(...points.value.map(p => p.n))
})

// Verdict is based on the next 24h, not the whole week. The back half is
// always wide and would drag every spot into "low confidence".
const verdict = computed(() => {
  const near = points.value.slice(0, 8)
  if (!near.length) return { label: '', color: '#888780' }
  const avg = near.reduce((a, p) => a + (p.hi - p.lo), 0) / near.length
  if (avg < 1) return { label: 'Models agree', color: '#1D9E75' }
  if (avg < 2) return { label: 'Some spread', color: '#BA7517' }
  return { label: 'Low confidence', color: '#A32D2D' }
})

const ariaLabel = computed(() =>
  `Wave height forecast showing the range across ${modelCount.value} models. ` +
  `Spread is ${spreadNow.value} feet now and ${spreadEnd.value} feet by day seven.`
)
</script>
