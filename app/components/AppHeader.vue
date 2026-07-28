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

            <!-- Auth buttons -->
            <template v-if="isLoggedIn">
              <!-- Account dropdown -->
              <div class="relative" ref="dropdownRef">
                <button 
                  @click="showDropdown = !showDropdown"
                  class="flex items-center gap-2 bg-gray-100 px-3 py-2 border-2 border-black rounded-[6px] font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  <span class="w-6 h-6 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center text-xs font-black">
                    {{ userInitial }}
                  </span>
                  <span class="hidden lg:inline">{{ displayName }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown menu -->
                <div 
                  v-if="showDropdown"
                  class="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-[6px] shadow-[4px_4px_0px_#000] overflow-hidden z-50"
                >
                  <div class="px-4 py-3 border-b-2 border-gray-200">
                    <p class="text-sm font-bold truncate">{{ user?.email }}</p>
                  </div>
                  <button
                    @click="handleSignOut"
                    class="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <NuxtLink 
                to="/login"
                class="bg-yellow-400 text-black font-bold px-4 py-2 border-2 border-black rounded-[6px] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all whitespace-nowrap"
              >
                SIGN IN
              </NuxtLink>
            </template>
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

          <template v-if="isLoggedIn">
            <div class="border-t border-gray-200 pt-2 mt-2">
              <p class="text-xs text-gray-500 uppercase font-bold mb-1">
                {{ user?.email }}
              </p>
              <button
                @click="handleSignOut"
                class="block py-2 text-gray-600 hover:text-black font-medium"
              >
                Sign Out
              </button>
            </div>
          </template>
          <template v-else>
            <NuxtLink 
              to="/login"
              @click="mobileMenuOpen = false"
              class="block py-2 text-yellow-600 hover:text-yellow-700 font-bold"
            >
              Sign In
            </NuxtLink>
          </template>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const { user, isLoggedIn, signOut } = useAuth()

const mobileMenuOpen = ref(false)
const showDropdown = ref(false)
const dropdownRef = ref(null)

const navLinks = [
  { name: 'Spots', href: '/spots' },
  { name: 'Blog', href: '/blog' },
  { name: 'How We Forecast', href: '/how-we-rate' },
  { name: 'About', href: '/about' }
]

const userInitial = computed(() => {
  if (!user.value?.email) return '?'
  return user.value.email.charAt(0).toUpperCase()
})

const displayName = computed(() => {
  if (!user.value?.email) return ''
  return user.value.email.split('@')[0]
})

const handleSignOut = async () => {
  showDropdown.value = false
  mobileMenuOpen.value = false
  await signOut()
}

// Close dropdown when clicking outside
const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
