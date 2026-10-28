<template>
  <BrutalCard v-if="points.length > 2" class="p-4 sm:p-5">
    <div class="flex items-center justify-between gap-3 mb-1">
      <div class="flex items-center gap-2 min-w-0">
        <h2 class="text-lg sm:text-xl font-black truncate">Wave energy</h2>
        <button
          type="button"
          @click="showInfo = !showInfo"
          :aria-expanded="showInfo"
          aria-label="What wave energy means"
          class="w-5 h-5 shrink-0 flex items-center justify-center rounded-full border-2 border-black text-[11px] font-black leading-none transition-colors"
          :class="showInfo ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
        >i</button>
      </div>
      <span class="text-xs font-black uppercase tracking-wide shrink-0">
        {{ readout.band }}
      </span>
    </div>

    <p class="text-xs text-gray-500 mb-4">
      How much energy each wave delivers, in kilojoules per metre of wave crest.
    </p>

    <div
      v-if="showInfo"
      class="mb-4 border-2 border-black rounded-[var(--radius)] bg-gray-50 p-3 space-y-2"
    >
      <p class="text-xs leading-relaxed">
        Two reports can both say 3ft and be completely different days. Energy is the number
        that separates them: it scales with height squared and with period squared, so 3ft at
        16 seconds delivers roughly four times the energy of 3ft at 8 seconds.
      </p>
      <p class="text-xs leading-relaxed">
        Groundswell and wind chop are measured separately and then added, which is why the
        chart is stacked. A day that is mostly hatching is mostly chop &mdash; the energy is
        real, but it is disorganised water, not lined-up swell.
      </p>
      <p class="text-xs leading-relaxed text-gray-500">
        High energy does not mean good surf, only powerful surf. 300 kJ/m under a hard
        onshore is still a washing machine.
      </p>
    </div>

    <!-- Readout. Doubles as the scrub display: drag the chart and this follows. -->
    <div class="flex items-end justify-between gap-4 mb-4">
      <div class="min-w-0">
        <p class="text-3xl sm:text-4xl font-black font-mono leading-none">
          {{ readout.display }}<span class="text-base font-bold"> kJ/m</span>
        </p>
        <p
          class="text-[10px] font-bold uppercase mt-1.5 transition-colors"
          :class="isScrubbing ? 'text-black' : 'text-gray-500'"
        >{{ readout.label }}</p>
      </div>
      <div v-if="readout.total > 0" class="min-w-0 flex-1 max-w-[55%]">
        <div class="flex h-3 border-2 border-black rounded-[3px] overflow-hidden">
          <div class="bg-yellow-400" :style="{ width: `${readout.swellPct}%` }"></div>
          <div
            v-if="readout.swellPct < 100"
            class="border-l-2 border-black"
            :style="{ width: `${100 - readout.swellPct}%`, background: HATCH_CSS }"
          ></div>
        </div>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1.5 text-right tabular-nums">
          {{ readout.swellKj }} swell &middot; {{ readout.chopKj }} chop
        </p>
      </div>
    </div>

    <!-- touch-pan-y: horizontal drags scrub, vertical drags still scroll the page -->
    <div
      ref="wrapEl"
      class="relative touch-pan-y select-none cursor-crosshair"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onLeave"
    >
      <svg ref="svgEl" :viewBox="`0 0 ${W} ${H}`" class="w-full block" role="img" :aria-label="ariaLabel">
        <defs>
          <pattern id="energy-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#fff" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#000" stroke-width="2.5" />
          </pattern>
        </defs>

        <line :x1="PAD_L" :y1="yFor(0)" :x2="W - PAD_R" :y2="yFor(0)" stroke="#000" stroke-width="1" opacity="0.9" />

        <!-- Band thresholds: the scale is the vocabulary, not arbitrary round numbers -->
        <g v-for="b in visibleBands" :key="`b${b.min}`">
          <line
            :x1="PAD_L" :y1="yFor(b.min)" :x2="W - PAD_R" :y2="yFor(b.min)"
            stroke="#000" stroke-width="1" stroke-dasharray="4 4" opacity="0.2"
          />
          <text
            :x="PAD_L - 6" :y="yFor(b.min) + 4"
            text-anchor="end" font-size="11" font-weight="700" fill="#6b7280"
          >{{ b.min }}</text>
          <text
            :x="W - PAD_R - 2" :y="yFor(b.min) - 5"
            text-anchor="end" font-size="10" font-weight="700" fill="#9ca3af"
            letter-spacing="0.5"
          >{{ b.label.toUpperCase() }}</text>
        </g>

        <!-- Stacked: groundswell on the bottom, chop hatched on top -->
        <path :d="swellPath" fill="#FACC15" fill-opacity="0.85" stroke="none" />
        <path :d="chopPath" fill="url(#energy-hatch)" fill-opacity="0.75" stroke="none" />
        <path :d="totalLine" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        <path :d="swellLine" fill="none" stroke="#000" stroke-width="1" opacity="0.35" />

        <line
          v-for="d in dayTicks"
          :key="`d${d.x}`"
          :x1="d.x" :y1="PAD_T" :x2="d.x" :y2="H - PAD_B"
          stroke="#000" stroke-width="1" opacity="0.15"
        />

        <text
          v-for="d in dayTicks"
          :key="`dl${d.x}`"
          :x="d.x + 5" :y="H - PAD_B + 16"
          font-size="11" font-weight="700" fill="#6b7280"
        >{{ d.label }}</text>

        <!-- Scrub marker -->
        <g v-if="isScrubbing && marker">
          <line
            :x1="marker.x" :y1="PAD_T" :x2="marker.x" :y2="H - PAD_B"
            stroke="#000" stroke-width="2"
          />
          <circle :cx="marker.x" :cy="marker.ySwell" r="3.5" fill="#FACC15" stroke="#000" stroke-width="2" />
          <circle :cx="marker.x" :cy="marker.yTotal" r="5" fill="#fff" stroke="#000" stroke-width="2.5" />
        </g>
      </svg>
    </div>

    <div class="flex items-center justify-between gap-4 mt-2">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 border-2 border-black bg-yellow-400 rounded-[2px]"></span>
          <span class="text-[10px] font-bold uppercase text-gray-500">Groundswell</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 border-2 border-black rounded-[2px]" :style="{ background: HATCH_CSS }"></span>
          <span class="text-[10px] font-bold uppercase text-gray-500">Wind chop</span>
        </div>
      </div>
      <button
        v-if="isScrubbing"
        type="button"
        @click="activeIndex = null"
        class="text-[10px] font-bold uppercase text-gray-500 underline shrink-0"
      >Back to now</button>
      <span v-else class="text-[10px] font-bold uppercase text-gray-400 shrink-0">Drag to scrub</span>
    </div>

    <div class="mt-4 pt-3 border-t-2 border-black grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-lg font-black leading-none">{{ peak.display }}</p>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1">Peak this week</p>
      </div>
      <div>
        <p class="text-lg font-black leading-none">{{ peak.when }}</p>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1">Peaks on</p>
      </div>
      <div>
        <p class="text-lg font-black leading-none">{{ peak.band }}</p>
        <p class="text-[10px] font-bold uppercase text-gray-500 mt-1">At its best</p>
      </div>
    </div>
  </BrutalCard>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  forecasts: { type: Array, default: () => [] }
})

const { getWaveEnergy, energyBand, formatEnergy, ENERGY_BANDS } = useWaveEnergy()

// The viewBox width tracks the rendered width, so one user unit is one CSS
// pixel at every size. A fixed 700-unit viewBox squeezed into a 330px phone
// scales everything by 0.47 — including text, so an 11px axis label lands at
// 5px. That is the usual reason SVG charts are unreadable on mobile.
const W = ref(700)
const H = 200
const PAD_L = 34
const PAD_R = 10
const PAD_T = 14
const PAD_B = 34

const wrapEl = ref(null)
let resizeObserver = null

onMounted(() => {
  const el = wrapEl.value
  if (!el) return

  const sync = () => {
    const w = el.clientWidth
    if (w > 0) W.value = Math.round(w)
  }

  sync()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(el)
  }
})

onBeforeUnmount(() => resizeObserver?.disconnect())

const showInfo = ref(false)
const svgEl = ref(null)
const activeIndex = ref(null)
const dragging = ref(false)

// Inline so the hatch can be reused in the HTML legend and split bar, where
// the SVG <defs> pattern isn't reachable.
const HATCH_CSS = 'repeating-linear-gradient(45deg, #000 0 2px, #fff 2px 5px)'

// One point every 3 hours. Hourly is finer than the eye resolves at this
// width, and it makes the scrub target uselessly small on a phone.
const points = computed(() => {
  const out = []
  for (const f of props.forecasts) {
    const t = new Date(f.timestamp)
    if (t.getUTCHours() % 3 !== 0) continue

    const e = getWaveEnergy(f)
    if (e.kjPerM === null) continue

    out.push({ t, swell: e.swell, chop: e.windWave, total: e.kjPerM })
  }
  return out
})

const isScrubbing = computed(() => activeIndex.value !== null)

// Defaults to the first point, so the card reads as "right now" until touched.
const active = computed(() => points.value[activeIndex.value ?? 0] ?? null)

const readout = computed(() => {
  const p = active.value
  if (!p) return { display: '--', band: '', label: 'Right now', total: 0, swellPct: 0, swellKj: '--', chopKj: '--' }
  return {
    display: formatEnergy(p.total),
    band: energyBand(p.total),
    label: isScrubbing.value
      ? p.t.toLocaleString('en-US', { weekday: 'short', hour: 'numeric' })
      : 'Right now',
    total: p.total,
    swellPct: p.total ? Math.round((p.swell / p.total) * 100) : 0,
    swellKj: formatEnergy(p.swell),
    chopKj: formatEnergy(p.chop)
  }
})

const peak = computed(() => {
  if (!points.value.length) return { display: '--', when: '--', band: '' }
  const p = points.value.reduce((a, b) => (b.total > a.total ? b : a))
  return {
    display: formatEnergy(p.total),
    when: p.t.toLocaleDateString('en-US', { weekday: 'short' }),
    band: energyBand(p.total)
  }
})

// Scaled to this spot's own week. A fixed scale would flatten the entire East
// Coast in summer and clip Hawaii in winter.
const maxKj = computed(() => {
  const hi = Math.max(...points.value.map(p => p.total), 0)
  // Floor of 15 kJ/m: roughly a 2ft 8s day, so a genuinely flat week still
  // draws against a sane axis instead of magnifying noise.
  return Math.max(hi * 1.15, 15)
})

const visibleBands = computed(() =>
  ENERGY_BANDS.filter(b => b.min > 0 && b.min < maxKj.value * 0.95)
)

const xFor = (i) => {
  const n = points.value.length
  if (n < 2) return PAD_L
  return PAD_L + (i / (n - 1)) * (W.value - PAD_L - PAD_R)
}

const yFor = (v) => {
  const top = PAD_T
  const bottom = H - PAD_B
  return bottom - (v / maxKj.value) * (bottom - top)
}

const marker = computed(() => {
  const i = activeIndex.value
  const p = active.value
  if (i === null || !p) return null
  return { x: xFor(i), yTotal: yFor(p.total), ySwell: yFor(p.swell) }
})

// --- scrubbing ----------------------------------------------------------
// Pointer events rather than mouse + touch pairs: one code path covers a
// mouse, a finger and a stylus, and pointer capture keeps the drag alive
// when the finger wanders outside the chart.
const indexFromEvent = (e) => {
  const el = svgEl.value
  const n = points.value.length
  if (!el || n < 2) return null

  const rect = el.getBoundingClientRect()
  if (!rect.width) return null

  // The SVG scales to the container, so map client px back into viewBox units.
  const svgX = ((e.clientX - rect.left) / rect.width) * W.value
  const frac = (svgX - PAD_L) / (W.value - PAD_L - PAD_R)
  return Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))))
}

const onDown = (e) => {
  dragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  activeIndex.value = indexFromEvent(e)
}

const onMove = (e) => {
  // A mouse scrubs on hover; a finger only scrubs while it's down.
  if (e.pointerType === 'mouse' || dragging.value) {
    activeIndex.value = indexFromEvent(e)
  }
}

const onUp = (e) => {
  dragging.value = false
  e.currentTarget.releasePointerCapture?.(e.pointerId)
  // Touch readouts stay put on release — the finger is covering the chart
  // at the moment you'd want to read it.
}

const onLeave = (e) => {
  if (e.pointerType === 'mouse' && !dragging.value) activeIndex.value = null
}

// --- paths --------------------------------------------------------------
const areaPath = (upper, lower) => {
  const pts = points.value
  if (pts.length < 2) return ''
  const up = pts.map((p, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(upper(p)).toFixed(1)}`).join(' ')
  const down = pts
    .map((p, i) => ({ x: xFor(i), y: yFor(lower(p)) }))
    .reverse()
    .map(c => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ')
  return `${up} ${down} Z`
}

const swellPath = computed(() => areaPath(p => p.swell, () => 0))
const chopPath = computed(() => areaPath(p => p.total, p => p.swell))

const linePath = (fn) =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(1)},${yFor(fn(p)).toFixed(1)}`).join(' ')

const totalLine = computed(() => linePath(p => p.total))
const swellLine = computed(() => linePath(p => p.swell))

const dayTicks = computed(() => {
  const out = []
  let last = null
  points.value.forEach((p, i) => {
    const key = p.t.toDateString()
    if (key !== last) {
      last = key
      if (i > 0) {
        out.push({ x: xFor(i), label: p.t.toLocaleDateString('en-US', { weekday: 'short' }) })
      }
    }
  })
  return out
})

const ariaLabel = computed(() =>
  `Wave energy over the next seven days. Currently ${formatEnergy(points.value[0]?.total ?? 0)} ` +
  `kilojoules per metre. Peaks at ${peak.value.display} on ${peak.value.when}.`
)
</script>
