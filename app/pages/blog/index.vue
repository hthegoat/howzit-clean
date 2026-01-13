<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div class="mb-10">
        <h1 class="text-3xl sm:text-5xl font-black uppercase mb-4">Blog</h1>
        <p class="text-gray-600">Surf forecasting, data, and the occasional rant.</p>
      </div>

      <div class="space-y-6">
        <NuxtLink 
          v-for="post in posts" 
          :key="post.slug"
          :to="`/blog/${post.slug}`"
          class="block bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <p class="text-sm text-gray-500 mb-2">{{ post.date }}</p>
          <h2 class="text-xl sm:text-2xl font-black mb-2">{{ post.title }}</h2>
          <p class="text-gray-600">{{ post.excerpt }}</p>
        </NuxtLink>
      </div>

      <div v-if="posts.length === 0" class="text-center py-12 text-gray-500">
        <p>No posts yet. Check back soon.</p>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const posts = [
  {
    slug: 'free-surf-report-app-no-ads',
    title: 'Free Surf Report App With No Ads — Why We Built Howzit',
    excerpt: 'Every surf app is either paywalled, ad-infested, or both. So I built something else.',
    date: 'January 13, 2026'
  },
  {
    slug: 'how-to-read-a-surf-report',
    title: 'How to Read a Surf Report: A Beginner\'s Guide to Better Waves',
    excerpt: 'Wave height, period, wind, tides — what does it all mean? Here\'s the guide I wish someone gave me when I started surfing.',
    date: 'January 12, 2026'
  },
  {
    slug: '3-wave-forecast-models',
    title: 'I Compared 3 Wave Forecast Models — Here\'s Why Your Surf App Might Be Lying to You',
    excerpt: 'Most surf apps use one model. When it\'s wrong, you\'re wrong. So I pulled data from three models and compared them. They disagreed 85% of the time.',
    date: 'January 12, 2026'
  }
]

const siteUrl = 'https://www.hwztsurf.com'

useHead({
  title: 'Blog - Howzit',
  meta: [
    { name: 'description', content: 'Surf forecasting insights, data deep-dives, and updates from Howzit.' },
    { property: 'og:title', content: 'Blog - Howzit' },
    { property: 'og:description', content: 'Surf forecasting insights and updates from Howzit.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/blog` },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/blog` }
  ]
})
</script>
