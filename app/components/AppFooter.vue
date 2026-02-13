<template>
  <footer class="border-t-2 border-black bg-white">
    <div class="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
      <div class="grid grid-cols-3 gap-6 max-w-lg mx-auto sm:max-w-xl">
        <div>
          <h3 class="font-black uppercase text-xs tracking-wider mb-3">Product</h3>
          <ul class="space-y-1.5 text-sm">
            <li><NuxtLink to="/#features" class="text-gray-500 hover:text-black">Features</NuxtLink></li>
            <li><NuxtLink to="/how-we-rate" class="text-gray-500 hover:text-black">How We Rate</NuxtLink></li>
            <li><NuxtLink to="/spots" class="text-gray-500 hover:text-black">All Spots</NuxtLink></li>
            <li><NuxtLink to="/pricing" class="text-gray-500 hover:text-black">Pricing</NuxtLink></li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-black uppercase text-xs tracking-wider mb-3">Company</h3>
          <ul class="space-y-1.5 text-sm">
            <li><NuxtLink to="/about" class="text-gray-500 hover:text-black">About</NuxtLink></li>
            <li><NuxtLink to="/open" class="text-gray-500 hover:text-black">Open Stats</NuxtLink></li>
            <li><NuxtLink to="/changelog" class="text-gray-500 hover:text-black">Changelog</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h3 class="font-black uppercase text-xs tracking-wider mb-3">Connect</h3>
          <ul class="space-y-1.5 text-sm">
            <li><a href="mailto:howzitsurfing@gmail.com" class="text-gray-500 hover:text-black">Email</a></li>
            <li><NuxtLink to="/blog" class="text-gray-500 hover:text-black">Blog</NuxtLink></li>
          </ul>
        </div>
      </div>
      
      <div class="mt-8 pt-5 border-t-2 border-black text-center">
        <p class="font-black uppercase text-sm mb-1">Built By A Surfer, Not A Corporation</p>
        <p class="text-gray-400 text-xs">&copy; {{ new Date().getFullYear() }} Howzit · Indie, ad-free, and <NuxtLink to="/open" class="underline hover:text-black">open</NuxtLink>.</p>
      </div>
    </div>
  </footer>
</template>
