<template>
  <div>
    <!-- Navigation -->
    <nav class="border-b-2 border-black sticky top-0 bg-white z-40">
      <div class="max-w-7xl mx-auto px-3 sm:px-6">
        <div class="flex justify-between items-center h-14 sm:h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2.5">
            <svg
              viewBox="8 8 186 154"
              class="h-7 sm:h-8 w-auto shrink-0"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M 194 54 L 122 66 L 139 8 L 113 12 L 98 51 L 66 59 L 79 15 L 48 20 L 8 142 L 41 127 L 58 83 L 89 75 L 79 108 L 136 87 L 57 162 L 170 150 L 193 120 L 121 132 Z"/>
            </svg>
            <span class="sr-only">Howzit</span>
            <span class="hidden sm:inline text-xs text-gray-500 font-medium">your second opinion</span>
          </NuxtLink>
          
          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-6">
            <SpotSearch />

            <NuxtLink 
              v-for="link in navLinks" 
              :key="link.name"
              :to="link.href"
              class="text-gray-700 hover:text-black font-medium"
            >
              {{ link.name }}
            </NuxtLink>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center gap-2 md:hidden">
            <SpotSearch compact />
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="p-2">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  v-if="!mobileMenuOpen"
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path 
                  v-else
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t-2 border-black bg-white">
        <div class="px-3 py-3 space-y-2">
          <NuxtLink 
            v-for="link in navLinks"
            :key="link.name"
            :to="link.href"
            @click="mobileMenuOpen = false"
            class="block py-2 text-gray-700 hover:text-black font-medium"
          >
            {{ link.name }}
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const mobileMenuOpen = ref(false)

const { isApp } = useRuntimeConfig().public

// Blog is stripped from the app bundle (it needs @nuxt/content and a server),
// so linking to it inside the app is a tap into a 404.
const navLinks = computed(() => [
  { name: 'Spots', href: '/spots' },
  ...(isApp ? [] : [{ name: 'Blog', href: '/blog' }]),
  { name: 'How We Forecast', href: '/how-we-rate' },
  { name: 'About', href: '/about' }
])
</script>
