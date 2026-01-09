<template>
  <footer class="border-t-2 border-black bg-white">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      <div class="grid grid-cols-2 gap-6 sm:gap-8">
        <div>
          <h3 class="font-bold mb-3">Product</h3>
          <ul class="space-y-2 text-sm">
            <li><NuxtLink to="/#features" class="text-gray-600 hover:text-black">Features</NuxtLink></li>
            <li><NuxtLink to="/how-we-rate" class="text-gray-600 hover:text-black">How We Rate</NuxtLink></li>
            <li><NuxtLink to="/spots" class="text-gray-600 hover:text-black">All Spots</NuxtLink></li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-bold mb-3">Company</h3>
          <ul class="space-y-2 text-sm">
            <li><NuxtLink to="/about" class="text-gray-600 hover:text-black">About</NuxtLink></li>
            <li><a href="mailto:hello@howzit.surf" class="text-gray-600 hover:text-black">Contact</a></li>
          </ul>
        </div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
        <p>&copy; 2025 Howzit. Built by surfers, for surfers.</p>
      </div>
    </div>
  </footer>
</template>
