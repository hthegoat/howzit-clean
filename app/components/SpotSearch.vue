<template>
  <div>
    <!-- Trigger -->
    <button
      v-if="compact"
      @click="openSearch"
      class="p-2 border-2 border-black rounded-[var(--radius)] bg-white hover:bg-gray-100 transition-colors"
      aria-label="Search spots"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
    </button>

    <button
      v-else
      @click="openSearch"
      class="flex items-center gap-2 w-56 px-3 py-2 border-2 border-black rounded-[var(--radius)] bg-white text-gray-500 text-sm font-medium hover:bg-gray-100 transition-colors"
      aria-label="Search spots"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <span class="flex-1 text-left">Search spots</span>
      <kbd class="hidden lg:inline text-[10px] font-black border-2 border-gray-300 rounded px-1 py-0.5 text-gray-400">
        {{ metaKeyLabel }}K
      </kbd>
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-[12vh] sm:pt-[15vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Search surf spots"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="closeSearch"></div>

        <!-- Panel -->
        <div
          class="relative w-full max-w-xl bg-white border-2 border-black rounded-[var(--radius)] shadow-[6px_6px_0px_#000] overflow-hidden"
          @click.stop
        >
          <!-- Input row -->
          <div class="flex items-center gap-3 px-4 py-3 border-b-2 border-black">
            <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Search 137 spots..."
              class="flex-1 min-w-0 bg-transparent outline-none text-base font-medium placeholder:text-gray-400"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="commit()"
              @keydown.esc.prevent="closeSearch"
            />
            <button
              @click="closeSearch"
              class="shrink-0 text-[10px] font-black uppercase border-2 border-gray-300 rounded px-1.5 py-1 text-gray-400 hover:border-black hover:text-black transition-colors"
            >
              Esc
            </button>
          </div>

          <!-- Results -->
          <div ref="listRef" class="max-h-[50vh] overflow-y-auto">
            <div v-if="loading" class="px-4 py-8 text-center text-sm text-gray-400">
              Loading spots...
            </div>

            <div v-else-if="!query.trim()" class="px-4 py-8 text-center text-sm text-gray-400">
              Type a spot, region, or state
            </div>

            <div v-else-if="!results.length" class="px-4 py-8 text-center text-sm text-gray-400">
              No spots match "{{ query.trim() }}"
            </div>

            <ul v-else>
              <li v-for="(spot, i) in results" :key="spot.id">
                <button
                  :data-idx="i"
                  @click="go(spot)"
                  @mousemove="selected = i"
                  class="w-full flex items-baseline gap-3 px-4 py-3 text-left border-b border-gray-200 transition-colors"
                  :class="selected === i ? 'bg-[#FACC15]' : 'bg-white hover:bg-gray-50'"
                >
                  <span class="font-bold truncate">
                    <span
                      v-for="(part, pi) in highlight(spot.name)"
                      :key="pi"
                      :class="part.hit ? 'underline decoration-2 underline-offset-2' : ''"
                    >{{ part.text }}</span>
                  </span>
                  <span class="ml-auto shrink-0 text-xs text-gray-500 font-medium">
                    {{ spot.region }}<span v-if="spot.state" class="text-gray-400"> · {{ spot.state }}</span>
                  </span>
                </button>
              </li>
            </ul>
          </div>

          <!-- Footer hint -->
          <div v-if="results.length" class="flex items-center gap-4 px-4 py-2 bg-gray-50 border-t-2 border-black text-[10px] font-bold uppercase text-gray-400">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Open</span>
            <span class="ml-auto">{{ results.length }} of {{ spots.length }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

defineProps({
  compact: { type: Boolean, default: false }
})

const supabase = useSupabaseClient()

const open = ref(false)
const query = ref('')
const selected = ref(0)
const spots = ref([])
const loaded = ref(false)
const loading = ref(false)
const inputRef = ref(null)
const listRef = ref(null)
const isMac = ref(false)

const metaKeyLabel = computed(() => (isMac.value ? '\u2318' : 'Ctrl+'))

// === Data (fetched once, on first open) ===
const loadSpots = async () => {
  if (loaded.value || loading.value) return
  loading.value = true
  const { data, error } = await supabase
    .from('spots')
    .select('id, name, slug, state, region')
    .order('name')
  if (!error) {
    spots.value = data || []
    loaded.value = true
  }
  loading.value = false
}

// === Scoring ===
const tokens = computed(() =>
  query.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
)

const wordStart = (haystack, token) => {
  let i = haystack.indexOf(token)
  while (i !== -1) {
    if (i === 0 || /[^a-z0-9]/.test(haystack[i - 1])) return true
    i = haystack.indexOf(token, i + 1)
  }
  return false
}

const scoreSpot = (spot, toks) => {
  const name = (spot.name || '').toLowerCase()
  const region = (spot.region || '').toLowerCase()
  const state = (spot.state || '').toLowerCase()

  let total = 0
  for (const t of toks) {
    let best = 0
    if (name.startsWith(t)) best = 100
    else if (wordStart(name, t)) best = 70
    else if (name.includes(t)) best = 45
    else if (state.startsWith(t)) best = 34
    else if (region.startsWith(t)) best = 32
    else if (wordStart(region, t)) best = 24
    else if (region.includes(t)) best = 16
    else if (state.includes(t)) best = 14

    // every token has to land somewhere, otherwise it's not a match
    if (best === 0) return 0
    total += best
  }

  // tiebreak: shorter names first
  return total - name.length * 0.1
}

const results = computed(() => {
  const toks = tokens.value
  if (!toks.length) return []
  return spots.value
    .map(s => ({ spot: s, score: scoreSpot(s, toks) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.spot)
})

// === Highlighting ===
const highlight = (text) => {
  const toks = tokens.value
  if (!toks.length || !text) return [{ text, hit: false }]

  const lower = text.toLowerCase()
  const marks = new Array(text.length).fill(false)
  for (const t of toks) {
    let i = lower.indexOf(t)
    while (i !== -1) {
      for (let k = i; k < i + t.length && k < marks.length; k++) marks[k] = true
      i = lower.indexOf(t, i + 1)
    }
  }

  const parts = []
  let buf = text[0]
  let hit = marks[0]
  for (let i = 1; i < text.length; i++) {
    if (marks[i] === hit) buf += text[i]
    else {
      parts.push({ text: buf, hit })
      buf = text[i]
      hit = marks[i]
    }
  }
  parts.push({ text: buf, hit })
  return parts
}

// === Navigation ===
const move = (delta) => {
  if (!results.value.length) return
  const n = results.value.length
  selected.value = (selected.value + delta + n) % n
  nextTick(scrollSelectedIntoView)
}

const scrollSelectedIntoView = () => {
  const el = listRef.value?.querySelector(`[data-idx="${selected.value}"]`)
  el?.scrollIntoView({ block: 'nearest' })
}

const commit = () => {
  const spot = results.value[selected.value]
  if (spot) go(spot)
}

const go = (spot) => {
  closeSearch()
  navigateTo(`/spots/${spot.slug}`)
}

// === Open / close ===
const openSearch = async () => {
  open.value = true
  document.body.style.overflow = 'hidden'
  loadSpots()
  await nextTick()
  inputRef.value?.focus()
}

const closeSearch = () => {
  open.value = false
  query.value = ''
  selected.value = 0
  document.body.style.overflow = ''
}

watch(query, () => {
  selected.value = 0
})

// === Global shortcut ===
const onKeydown = (e) => {
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value ? closeSearch() : openSearch()
    return
  }
  if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    closeSearch()
  }
}

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>
