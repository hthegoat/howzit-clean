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
          :key="post.path"
          :to="post.path"
          class="block bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <p class="text-sm text-gray-500 mb-2">
            {{ formatDate(post.date) }}<template v-if="post.readingTime"> · {{ post.readingTime }} min read</template>
          </p>
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
const supabase = useSupabaseClient()

// Native markdown posts plus posts published through the NotFair SEO webhook
// (notfair_posts table). A native post wins any slug collision.
const { data: posts } = await useAsyncData('blog-posts', async () => {
  const [native, notfairRes] = await Promise.all([
    queryContent('blog').sort({ date: -1 }).find(),
    supabase
      .from('notfair_posts')
      .select('slug, title, meta_description, reading_time_minutes, created_at')
      .order('created_at', { ascending: false })
  ])

  const nativePosts = native.map(p => ({
    path: p._path,
    slug: p._path.split('/').pop(),
    title: p.title,
    description: p.description,
    date: p.date,
    readingTime: null
  }))
  const taken = new Set(nativePosts.map(p => p.slug))

  const notfairPosts = (notfairRes.data || [])
    .filter(p => !taken.has(p.slug))
    .map(p => ({
      path: `/blog/${p.slug}`,
      slug: p.slug,
      title: p.title,
      description: p.meta_description,
      date: p.created_at,
      readingTime: p.reading_time_minutes
    }))

  return [...nativePosts, ...notfairPosts]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
})

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
