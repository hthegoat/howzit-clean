<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <!-- Back link -->
      <NuxtLink to="/blog" class="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8">
        <span>←</span> All posts
      </NuxtLink>

      <article>
        <header class="mb-10 pb-8 border-b-2 border-gray-200">
          <p class="text-sm text-gray-500 uppercase tracking-wide mb-3">
            {{ formatDate(post.date) }}<template v-if="post.readingTime"> · {{ post.readingTime }} min read</template>
          </p>
          <h1 class="text-3xl sm:text-4xl font-black leading-tight mb-4">{{ post.title }}</h1>
          <p v-if="post.description" class="text-lg text-gray-600">{{ post.description }}</p>
          <ul v-if="post.tags.length" class="flex flex-wrap gap-2 mt-5">
            <li
              v-for="tag in post.tags"
              :key="tag"
              class="font-mono text-xs font-bold uppercase border-2 border-black rounded px-2 py-0.5 bg-white"
            >{{ tag }}</li>
          </ul>
        </header>

        <img
          v-if="post.image"
          :src="post.image"
          :alt="post.title"
          width="1200"
          height="630"
          class="w-full h-auto mb-10 border-2 border-black rounded-lg shadow-[4px_4px_0px_#000]"
        >

        <div class="prose prose-lg max-w-none">
          <ContentRenderer v-if="native" :value="native" />
          <!-- Sanitized when stored (server/utils/notfair.ts) -->
          <div v-else v-html="notfair.content_html_safe" />
        </div>

        <!-- CTA -->
        <div class="mt-12 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <h3 class="font-bold text-lg mb-2">Check out Howzit</h3>
          <p class="text-gray-700 mb-4">Free surf forecasts for 149 US spots. Multi-model blending, confidence indicators, no BS.</p>
          <NuxtLink to="/spots" class="inline-block bg-black text-white font-bold px-6 py-3 rounded hover:bg-gray-800 transition-colors">
            View All Spots →
          </NuxtLink>
        </div>
      </article>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug
const supabase = useSupabaseClient()

// Native markdown first; a native post wins any slug collision. Otherwise look
// for a post delivered by the NotFair SEO webhook (notfair_posts table).
const { data } = await useAsyncData(`blog-${slug}`, async () => {
  const native = await queryContent('blog', slug).findOne().catch(() => null)
  if (native) return { native, notfair: null }

  const { data: notfair } = await supabase
    .from('notfair_posts')
    .select('slug, title, content_html_safe, meta_description, tags, image_url, reading_time_minutes, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle()
  return { native: null, notfair: notfair || null }
})

// Unknown slug: a real 404 rather than a 200 "Post not found" page.
if (!data.value?.native && !data.value?.notfair) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const native = computed(() => data.value?.native || null)
const notfair = computed(() => data.value?.notfair || null)

// One shape for the header and SEO tags, whichever source the post came from.
const post = computed(() => {
  if (native.value) {
    const n = native.value
    return {
      title: n.title,
      description: n.description,
      date: n.date,
      updated: null,
      readingTime: null,
      tags: Array.isArray(n.tags) ? n.tags : [],
      image: n.image || null
    }
  }
  const p = notfair.value
  return {
    title: p.title,
    description: p.meta_description,
    date: p.created_at,
    updated: p.updated_at,
    readingTime: p.reading_time_minutes,
    tags: p.tags || [],
    image: p.image_url
  }
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

// SEO meta tags
useSeoMeta({
  title: () => `${post.value.title} - Howzit`,
  description: () => post.value.description || '',
  ogTitle: () => post.value.title,
  ogDescription: () => post.value.description || '',
  ogType: 'article',
  ogUrl: `${siteUrl}/blog/${slug}`,
  ogImage: () => post.value.image || undefined,
  twitterImage: () => post.value.image || undefined,
  articlePublishedTime: () => post.value.date ? new Date(post.value.date).toISOString() : undefined,
  articleModifiedTime: () => post.value.updated || undefined,
  articleTag: () => post.value.tags.length ? post.value.tags : undefined,
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
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.value.title,
        description: post.value.description,
        datePublished: post.value.date,
        ...(post.value.updated ? { dateModified: post.value.updated } : {}),
        ...(post.value.image ? { image: [post.value.image] } : {}),
        ...(post.value.tags.length ? { keywords: post.value.tags.join(', ') } : {}),
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
.prose img {
  @apply max-w-full h-auto my-8 border-2 border-black rounded-lg;
}
.prose figure {
  @apply my-8;
}
.prose figure img {
  @apply my-0;
}
.prose figcaption {
  @apply mt-2 text-sm text-gray-500 font-mono;
}
.prose ol {
  @apply list-decimal pl-6 mb-6 space-y-2;
}
</style>
