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
          :key="post._path"
          :to="post._path"
          class="block bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <p class="text-sm text-gray-500 mb-2">{{ formatDate(post.date) }}</p>
          <h2 class="text-xl sm:text-2xl font-black mb-2">{{ post.title }}</h2>
          <p class="text-gray-600">{{ post.description }}</p>
        </NuxtLink>
      </div>

      <div v-if="!posts?.length" class="text-center py-12 text-gray-500">
        <p>No posts yet. Check back soon.</p>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const { data: posts } = await useAsyncData('blog-posts', () => 
  queryContent('blog')
    .sort({ date: -1 })
    .find()
)

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const siteUrl = 'https://hwztsurf.com'

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
