<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <!-- Back link -->
      <NuxtLink to="/blog" class="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8">
        <span>←</span> All posts
      </NuxtLink>

      <article v-if="post">
        <header class="mb-10 pb-8 border-b-2 border-gray-200">
          <p class="text-sm text-gray-500 uppercase tracking-wide mb-3">{{ formatDate(post.date) }}</p>
          <h1 class="text-3xl sm:text-4xl font-black leading-tight mb-4">{{ post.title }}</h1>
          <p class="text-lg text-gray-600">{{ post.description }}</p>
        </header>

        <div class="prose prose-lg max-w-none">
          <ContentRenderer :value="post" />
        </div>

        <!-- CTA -->
        <div class="mt-12 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <h3 class="font-bold text-lg mb-2">Check out Howzit</h3>
          <p class="text-gray-700 mb-4">Free surf forecasts for 76 East Coast spots. Multi-model blending, confidence indicators, no BS.</p>
          <NuxtLink to="/spots" class="inline-block bg-black text-white font-bold px-6 py-3 rounded hover:bg-gray-800 transition-colors">
            View All Spots →
          </NuxtLink>
        </div>
      </article>

      <div v-else class="text-center py-12">
        <p class="text-gray-500 mb-4">Post not found.</p>
        <NuxtLink to="/blog" class="text-blue-600 hover:underline">Back to blog</NuxtLink>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

const { data: post } = await useAsyncData(`blog-${slug}`, () => 
  queryContent('blog', slug).findOne()
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

// SEO meta tags
useSeoMeta({
  title: () => post.value ? `${post.value.title} - Howzit` : 'Post Not Found - Howzit',
  description: () => post.value?.description || '',
  ogTitle: () => post.value?.title || '',
  ogDescription: () => post.value?.description || '',
  ogType: 'article',
  ogUrl: `${siteUrl}/blog/${slug}`,
  author: 'Harrison Kug',
})

// Canonical URL
useHead({
  link: [
    { rel: 'canonical', href: `${siteUrl}/blog/${slug}` }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.value?.title,
        description: post.value?.description,
        datePublished: post.value?.date,
        author: {
          '@type': 'Person',
          name: 'Harrison Kug'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Howzit',
          url: siteUrl
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}/blog/${slug}`
        }
      })
    }
  ]
})
</script>

<style>
.prose h2 {
  @apply text-2xl font-black mt-12 mb-4 pb-2 border-b-2 border-black;
}
.prose h3 {
  @apply text-lg font-bold mt-8 mb-3;
}
.prose p {
  @apply mb-5 leading-relaxed text-gray-800;
}
.prose ul {
  @apply list-none pl-0 mb-6 space-y-2;
}
.prose ul li {
  @apply pl-6 relative;
}
.prose ul li::before {
  content: "→";
  @apply absolute left-0 text-gray-400;
}
.prose blockquote {
  @apply bg-gray-100 border-l-4 border-black p-5 my-6 font-mono text-sm rounded-r-lg;
}
.prose table {
  @apply w-full border-2 border-black mb-6 text-sm;
}
.prose th {
  @apply bg-black text-white text-left p-3 font-bold;
}
.prose td {
  @apply border border-gray-300 p-3;
}
.prose tr:nth-child(even) {
  @apply bg-gray-50;
}
.prose a {
  @apply text-blue-600 underline hover:text-blue-800;
}
.prose strong {
  @apply font-bold text-black;
}
.prose em {
  @apply italic;
}
</style>
