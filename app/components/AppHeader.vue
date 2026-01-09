<template>
  <div>
    <!-- Announcement Bar -->
    <div class="bg-black text-white text-center py-2 sm:py-3 text-xs sm:text-sm font-medium tracking-wide">
      🏄 100 LIFETIME MEMBERSHIPS AVAILABLE — <NuxtLink to="/waitlist" class="underline hover:text-yellow-400">BECOME A FOUNDING MEMBER</NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="border-b-2 border-black sticky top-0 bg-white z-40">
      <div class="max-w-7xl mx-auto px-3 sm:px-6">
        <div class="flex justify-between items-center h-14 sm:h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-baseline gap-2">
            <span class="text-xl sm:text-2xl font-black">howzit</span>
            <span class="hidden sm:inline text-xs text-gray-500 font-medium">your second opinion</span>
          </NuxtLink>
          
          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-6">
            <NuxtLink 
              v-for="link in navLinks" 
              :key="link.name"
              :to="link.href"
              class="text-gray-700 hover:text-black font-medium"
            >
              {{ link.name }}
            </NuxtLink>
            <NuxtLink 
              to="/waitlist"
              class="bg-yellow-400 text-black font-bold px-4 py-2 border-2 border-black rounded-[6px] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all whitespace-nowrap"
            >
              JOIN WAITLIST
            </NuxtLink>
          </div>

          <!-- Mobile menu button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2">
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
          <NuxtLink 
            to="/waitlist"
            @click="mobileMenuOpen = false"
            class="block py-2 text-yellow-600 hover:text-yellow-700 font-bold"
          >
            Join Waitlist
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Spots', href: '/spots' },
  { name: 'How We Forecast', href: '/how-we-rate' },
  { name: 'About', href: '/about' }
]
</script>
