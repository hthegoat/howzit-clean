<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />

    <main class="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      <div class="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl sm:text-5xl font-black uppercase leading-none">Status</h1>
          <p class="text-xs font-mono uppercase text-gray-500 mt-2">
            Data pipeline &middot; live &middot; {{ status ? `checked ${ago(status.generated_at)}` : '--' }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 bg-white border-2 border-black rounded-[6px] px-3 py-1.5 text-xs font-black uppercase sm:shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          :disabled="pending"
          @click="refresh()"
        >{{ pending ? 'Checking' : 'Refresh' }}</button>
      </div>

      <div v-if="error" class="border-2 border-black rounded-[6px] p-5 bg-white font-bold uppercase text-sm">
        Status endpoint failed: {{ error.message }}
      </div>

      <div v-else-if="status" class="space-y-6">

        <!-- Verdict -->
        <div
          class="border-2 border-black rounded-[6px] p-5 sm:p-6 sm:shadow-[4px_4px_0px_#000]"
          :style="{ backgroundColor: VERDICT_BG[overall] }"
        >
          <p class="text-2xl sm:text-4xl font-black uppercase leading-none" :class="overall === 'fail' ? 'text-white' : 'text-black'">
            {{ overall === 'ok' ? 'All good' : overall === 'warn' ? 'Mostly working' : 'Something is broken' }}
          </p>
          <p class="text-xs font-mono uppercase mt-2" :class="overall === 'fail' ? 'text-white' : 'text-black'">
            {{ counts.ok }} ok &middot; {{ counts.warn }} warn &middot; {{ counts.fail }} fail
            <template v-if="badJobs.length"> &middot; {{ badJobs.length }} job{{ badJobs.length > 1 ? 's' : '' }} unhappy</template>
          </p>
        </div>

        <!-- Checks -->
        <BrutalCard class="p-4 sm:p-5">
          <div class="flex justify-between items-baseline mb-3">
            <p class="text-card-title">Checks</p>
            <p class="text-[10px] font-mono uppercase text-gray-400">last 14 days &rarr; now</p>
          </div>
          <div class="divide-y divide-gray-200">
            <div v-for="c in status.checks" :key="c.check_name" class="py-2.5">
              <div class="flex items-center gap-3">
                <StatusChip :status="c.status" />
                <p class="font-black uppercase text-sm min-w-0 truncate">{{ CHECK_LABELS[c.check_name] || c.check_name }}</p>
                <p class="ml-auto font-mono text-sm tabular-nums shrink-0">{{ c.observed }}/{{ c.expected }}</p>
              </div>
              <div class="flex items-center gap-3 mt-1.5">
                <div class="flex gap-[3px] shrink-0">
                  <span
                    v-for="d in historyFor(c.check_name)"
                    :key="d.day"
                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-black rounded-[2px]"
                    :style="{ backgroundColor: d.status ? STATUS_COLOR[d.status] : '#fff' }"
                    :title="`${d.day}: ${d.status || 'no check ran'}`"
                  ></span>
                </div>
                <p class="text-[10px] text-gray-500 min-w-0 truncate">{{ c.detail }}</p>
              </div>
            </div>
          </div>
        </BrutalCard>

        <!-- Jobs -->
        <BrutalCard class="p-4 sm:p-5">
          <div class="flex justify-between items-baseline mb-3">
            <p class="text-card-title">Jobs</p>
            <p class="text-[10px] font-mono uppercase text-gray-400">latest run, batches rolled up</p>
          </div>
          <p v-if="!status.jobs.length" class="text-sm font-bold uppercase text-gray-400">No runs logged yet</p>
          <div class="divide-y divide-gray-200">
            <div v-for="j in jobGroups" :key="j.job" class="py-2.5">
              <div class="flex items-center gap-3">
                <StatusChip :status="j.status" />
                <p class="font-black uppercase text-sm min-w-0 truncate">
                  {{ JOB_LABELS[j.job] || j.job }}
                  <span v-if="j.batches > 1" class="font-mono font-bold text-gray-400 normal-case">{{ j.batches }} batches</span>
                </p>
                <p class="ml-auto font-mono text-xs text-gray-500 shrink-0 tabular-nums">
                  <span v-if="j.processed != null">{{ j.processed }} ok<template v-if="j.failed"> / {{ j.failed }} miss</template> &middot; </span>{{ ago(j.started_at) }}
                </p>
              </div>
              <p v-if="j.bad_24h" class="text-[10px] font-bold uppercase text-red-600 mt-1">
                {{ j.bad_24h }} of {{ j.runs_24h }} runs failed or died in 24h
              </p>
              <p v-if="j.error" class="font-mono text-[11px] text-gray-600 mt-1 break-words">{{ j.error }}</p>
            </div>
          </div>
        </BrutalCard>

        <!-- Freshness -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BrutalCard v-for="f in freshness" :key="f.label" class="p-3 sm:p-4">
            <p class="text-[10px] font-bold uppercase text-gray-500">{{ f.label }}</p>
            <p class="text-lg sm:text-xl font-black font-mono leading-tight mt-1" :class="f.stale ? 'text-red-600' : ''">{{ f.value }}</p>
          </BrutalCard>
        </div>

        <!-- Problem spots -->
        <BrutalCard class="p-4 sm:p-5">
          <div class="flex justify-between items-baseline mb-3">
            <p class="text-card-title">Spots with gaps</p>
            <p class="font-mono text-sm">{{ status.problem_spots.length }}</p>
          </div>
          <p v-if="!status.problem_spots.length" class="text-sm font-bold uppercase text-gray-400">Every spot has everything</p>
          <template v-else>
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span
                v-for="(n, issue) in issueCounts"
                :key="issue"
                class="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black rounded-[4px] bg-white"
              >{{ issue }} &times;{{ n }}</span>
            </div>
            <div class="divide-y divide-gray-200">
              <div v-for="s in shownSpots" :key="s.slug" class="py-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <NuxtLink :to="`/spots/${s.slug}`" class="font-bold text-sm hover:underline">{{ s.name }}</NuxtLink>
                <span class="text-[10px] uppercase text-gray-400">{{ s.state }}</span>
                <span class="ml-auto font-mono text-[11px] text-gray-600">{{ s.issues.join(' · ') }}</span>
              </div>
            </div>
            <button
              v-if="status.problem_spots.length > SPOT_PREVIEW"
              type="button"
              class="mt-3 text-[10px] font-bold uppercase underline text-gray-500"
              @click="showAllSpots = !showAllSpots"
            >{{ showAllSpots ? 'Show fewer' : `Show all ${status.problem_spots.length}` }}</button>
          </template>
        </BrutalCard>

        <p class="text-[10px] font-mono uppercase text-gray-400">
          Alerts check: {{ status.last_alert_check ? ago(status.last_alert_check) : 'never' }} &middot; runs 07:00 + 19:00 UTC
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, h, onMounted, onBeforeUnmount } from 'vue'

// Everything on this page comes from get_pipeline_status() in SQL, via
// /api/status. To add a check, add a row to pipeline_health_snapshot().

const { data: status, pending, error, refresh } = await useFetch('/api/status')

// Status colours are their own lane: never the rating palette, never the
// wind palette.
const STATUS_COLOR = { ok: '#111827', warn: '#F59E0B', fail: '#DC2626', partial: '#F59E0B', error: '#DC2626', killed: '#DC2626', running: '#9CA3AF' }
const VERDICT_BG = { ok: '#FACC15', warn: '#FDE68A', fail: '#DC2626' }

const CHECK_LABELS = {
  openmeteo_coverage: 'Open-Meteo',
  ww3_coverage: 'WaveWatch III',
  ecmwf_coverage: 'ECMWF',
  three_model_spots: 'All 3 models',
  ai_summaries: 'AI summaries',
  buoy_readings: 'Buoys',
  tide_coverage: 'Tides',
  job_runs: 'Jobs finishing',
}

const JOB_LABELS = {
  'ingest-openmeteo': 'Forecasts',
  'ingest-buoys': 'Buoys',
  'ingest-tides': 'Tides',
  'generate-all-summaries': 'Summaries',
  'pipeline-health': 'Alerts',
}

// Small inline component so the chip markup lives in one place
const StatusChip = (props) => h('span', {
  class: 'inline-block shrink-0 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border-2 border-black',
  style: {
    backgroundColor: props.status === 'ok' ? '#fff' : STATUS_COLOR[props.status] || '#fff',
    color: ['fail', 'error', 'killed'].includes(props.status) ? '#fff' : '#000',
  },
}, props.status)
StatusChip.props = ['status']

// Batched jobs (forecasts x10, summaries x15) roll up into one row: worst
// status wins, counts add up, the worst batch's error is shown.
const SEVERITY = { killed: 4, error: 3, partial: 2, running: 1, ok: 0 }
const jobGroups = computed(() => {
  const groups = new Map()
  for (const j of status.value?.jobs || []) {
    const g = groups.get(j.job)
    if (!g) {
      groups.set(j.job, { ...j, batches: 1 })
      continue
    }
    g.batches++
    if (j.processed != null) g.processed = (g.processed || 0) + j.processed
    if (j.failed != null) g.failed = (g.failed || 0) + j.failed
    g.bad_24h += j.bad_24h
    g.runs_24h += j.runs_24h
    if (new Date(j.started_at) > new Date(g.started_at)) g.started_at = j.started_at
    if ((SEVERITY[j.status] ?? 0) > (SEVERITY[g.status] ?? 0)) {
      g.status = j.status
      g.error = j.error ?? g.error
    } else if (!g.error && j.error) {
      g.error = j.error
    }
  }
  return [...groups.values()]
})

const counts = computed(() => {
  const c = { ok: 0, warn: 0, fail: 0 }
  for (const x of status.value?.checks || []) c[x.status] = (c[x.status] || 0) + 1
  return c
})

const badJobs = computed(() =>
  (status.value?.jobs || []).filter(j => ['error', 'killed'].includes(j.status) || j.bad_24h > 0)
)

const overall = computed(() => {
  if (counts.value.fail || badJobs.value.some(j => j.status === 'killed')) return 'fail'
  if (counts.value.warn || badJobs.value.length) return 'warn'
  return 'ok'
})

// 14 squares, oldest first. A missing day means the health check itself
// didn't run, which is worth seeing.
const historyFor = (name) => {
  const days = new Map((status.value?.history?.[name] || []).map(d => [d.day, d.status]))
  const out = []
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    out.push({ day, status: days.get(day) || null })
  }
  return out
}

const now = ref(Date.now())
const ago = (iso) => {
  if (!iso) return '--'
  const mins = Math.round((now.value - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const hoursSince = (iso) => (iso ? (now.value - new Date(iso).getTime()) / 3600000 : Infinity)

const freshness = computed(() => {
  const f = status.value?.freshness || {}
  const tideDays = f.tides_until ? Math.floor((new Date(f.tides_until).getTime() - now.value) / 86400000) : null
  return [
    { label: 'Last forecast', value: ago(f.forecast), stale: hoursSince(f.forecast) > 13 },
    { label: 'Last buoy', value: ago(f.buoy), stale: hoursSince(f.buoy) > 2 },
    { label: 'Last summary', value: ago(f.summary), stale: hoursSince(f.summary) > 13 },
    { label: 'Tides through', value: tideDays == null ? '--' : `${tideDays}d out`, stale: tideDays == null || tideDays < 3 },
  ]
})

const issueCounts = computed(() => {
  const out = {}
  for (const s of status.value?.problem_spots || []) {
    for (const i of s.issues) {
      const key = i.startsWith('buoy ') ? 'buoy no waves' : i
      out[key] = (out[key] || 0) + 1
    }
  }
  return out
})

const SPOT_PREVIEW = 12
const showAllSpots = ref(false)
const shownSpots = computed(() => {
  const all = status.value?.problem_spots || []
  return showAllSpots.value ? all : all.slice(0, SPOT_PREVIEW)
})

// Keep it live while the tab is open
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
    if (document.visibilityState === 'visible') refresh()
  }, 60_000)
})
onBeforeUnmount(() => clearInterval(timer))

useHead({
  title: 'Status - Howzit',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
