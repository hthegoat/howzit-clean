<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />

    <main class="max-w-xl mx-auto px-4 py-16 sm:py-24">
      <div class="bg-white border-2 border-black rounded-[6px] p-6 sm:p-8 sm:shadow-[4px_4px_0px_#000]">
        <p class="font-mono text-xs font-bold uppercase text-gray-500">Error {{ error?.statusCode || 500 }}</p>
        <h1 class="text-3xl sm:text-4xl font-black uppercase leading-none mt-2">
          {{ is404 ? 'Flat. Nothing here.' : 'Wipeout.' }}
        </h1>
        <p class="text-sm text-gray-600 mt-3">
          {{ is404 ? 'That page or spot does not exist.' : 'Something broke on our end. Try again in a minute.' }}
        </p>
        <div class="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            class="bg-yellow-400 border-2 border-black rounded-[6px] px-5 py-2.5 text-sm font-black uppercase hover:bg-yellow-300"
            @click="clearError({ redirect: '/spots' })"
          >All spots</button>
          <button
            v-if="!is404"
            type="button"
            class="bg-white border-2 border-black rounded-[6px] px-5 py-2.5 text-sm font-black uppercase hover:bg-gray-100"
            @click="reload"
          >Try again</button>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
const props = defineProps({
  error: { type: Object, default: null }
})

const is404 = computed(() => props.error?.statusCode === 404)

const reload = () => {
  if (import.meta.client) window.location.reload()
}

useHead({
  title: computed(() => (is404.value ? 'Not Found - Howzit' : 'Error - Howzit')),
  meta: [{ name: 'robots', content: 'noindex' }]
})
</script>
