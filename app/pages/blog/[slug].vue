<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <!-- Back link -->
      <NuxtLink to="/blog" class="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8">
        <span>←</span> All posts
      </NuxtLink>

      <article v-if="post">
        <header class="mb-8">
          <p class="text-sm text-gray-500 mb-2">{{ post.date }}</p>
          <h1 class="text-2xl sm:text-4xl font-black leading-tight mb-4">{{ post.title }}</h1>
          <p class="text-gray-600">By Harrison Kug</p>
        </header>

        <div class="prose prose-lg max-w-none" v-html="post.content"></div>

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

const posts = {
  '3-wave-forecast-models': {
    title: "I Compared 3 Wave Forecast Models — Here's Why Your Surf App Might Be Lying to You",
    date: 'January 12, 2026',
    excerpt: "Most surf apps use one model. When it's wrong, you're wrong. So I pulled data from three models and compared them. They disagreed 85% of the time.",
    content: `
      <p>Drove an hour last month to check a swell. App said 3-4ft, clean. Pulled up to knee-high slop.</p>
      
      <p>Sound familiar?</p>
      
      <p>I've been surfing the East Coast for years and this keeps happening. Not occasionally — regularly. The forecasts just... miss. And I got tired of it.</p>
      
      <p>So I did something probably stupid. I spent a weekend pulling data from three different wave models and comparing them for the same spot. Nerdy? Yes. Worth it? Actually, yeah.</p>
      
      <h2>Here's the thing nobody talks about</h2>
      
      <p>Your surf app probably uses one model. Just one. Surfline has theirs. MSW has theirs. When that model screws up, you screwed up too.</p>
      
      <p>Wave forecasting is hard. Like, genuinely difficult. The ocean doesn't care about our algorithms. Models make different guesses about wind patterns, how swells travel, what the seafloor does to waves. They're all kinda right and kinda wrong at the same time.</p>
      
      <p>East Coast makes it worse:</p>
      <ul>
        <li>Hurricane swells that zig when models say zag</li>
        <li>Nor'easters that pop up fast</li>
        <li>Junky wind swell that's there one hour, gone the next</li>
      </ul>
      
      <p>I figured — what if I just looked at all the models at once?</p>
      
      <h2>What I actually did</h2>
      
      <p>Grabbed 48 hours of forecasts for Deal, NJ from three models:</p>
      
      <p><strong>WaveWatch III</strong> — NOAA runs this one. Been around since the 90s. American model, uses our weather data. Pretty good at catching swells early and tracking short-period stuff.</p>
      
      <p><strong>ECMWF WAM</strong> — European model. These are the folks who nailed Hurricane Sandy when American models had it going out to sea. Generally solid for 3-7 days out.</p>
      
      <p><strong>Open-Meteo</strong> — Open source thing that pulls from multiple places. Decent baseline, lots of detail on swell components.</p>
      
      <p>Same beach. Same hours. Three answers.</p>
      
      <h2>They disagreed. A lot.</h2>
      
      <p>Only matched within half a foot about <strong>15% of the time</strong>.</p>
      
      <p>Fifteen percent! These models power the apps we all use. And they're giving different answers most of the time.</p>
      
      <p>Check this out from January 10th:</p>
      
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>WaveWatch III</th>
            <th>ECMWF</th>
            <th>Open-Meteo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>6 AM</td>
            <td>0.4 ft</td>
            <td>1.4 ft</td>
            <td>1.2 ft</td>
          </tr>
          <tr>
            <td>Noon</td>
            <td>1.0 ft</td>
            <td>1.6 ft</td>
            <td>1.4 ft</td>
          </tr>
          <tr>
            <td>6 PM</td>
            <td>4.2 ft</td>
            <td>2.0 ft</td>
            <td>1.8 ft</td>
          </tr>
        </tbody>
      </table>
      
      <p>That 6 PM row though. WaveWatch saw something coming that the European models missed entirely. Some ENE energy that they smoothed over.</p>
      
      <p>Ended up being a short-lived bump that evening. WW3 was right.</p>
      
      <p>But — and this is important — ECMWF is usually better for planning a few days ahead. WW3 reacts faster to local stuff. Neither is "the best." They're good at different things.</p>
      
      <h2>So what do you do with this?</h2>
      
      <p>If you showed a surfer all three numbers, they'd naturally average them out in their head. "Two say 2ft, one says 4ft... probably 2-something but worth watching."</p>
      
      <p>That's basically what I built:</p>
      
      <p><strong>All three close together?</strong> Average them. High confidence. Go surf.</p>
      
      <p><strong>Two agree, one's different?</strong> Trust the pair more. Medium confidence.</p>
      
      <p><strong>All over the place?</strong> Take the middle number but flag it. Low confidence. Maybe check cams before driving.</p>
      
      <p>Simple stuff. But no app was showing this.</p>
      
      <h2>Why should you care?</h2>
      
      <p>When models agree — commit. Dawn patrol. Send it.</p>
      
      <p>When they don't — stay loose. Check the buoy in the morning. Don't drive two hours on a guess.</p>
      
      <p>Regular forecasts hide this from you. They give you one number like it's gospel. It's not. It's one model's opinion.</p>
      
      <h2>I built this thing</h2>
      
      <p>Called it <a href="https://www.hwztsurf.com">Howzit</a>. Free forecast for 76 East Coast spots.</p>
      
      <p>There's a surf graph with a toggle — HWZT, WW3, ECMWF, OM. HWZT is the blend. But you can flip through each model and see exactly what it thinks. Hover on any hour and you see all three numbers plus confidence.</p>
      
      <p>No mystery. No "trust our proprietary algorithm." Just the data.</p>
      
      <h2>Bottom line</h2>
      
      <p>Nobody's cracked surf forecasting. Anyone saying otherwise is selling premium subscriptions.</p>
      
      <p>But stacking models and being upfront about uncertainty? That's something. Sometimes you commit to dawn patrol. Sometimes you sleep in. At least you're deciding with real info instead of one algorithm's best guess.</p>
    `
  }
}

const post = posts[slug] || null

const siteUrl = 'https://www.hwztsurf.com'

useHead({
  title: post ? `${post.title} - Howzit` : 'Post Not Found - Howzit',
  meta: [
    { name: 'description', content: post?.excerpt || '' },
    { property: 'og:title', content: post?.title || '' },
    { property: 'og:description', content: post?.excerpt || '' },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `${siteUrl}/blog/${slug}` },
    { name: 'author', content: 'Harrison Kug' },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/blog/${slug}` }
  ]
})
</script>

<style>
.prose h2 {
  @apply text-xl font-black mt-8 mb-4;
}
.prose p {
  @apply mb-4 leading-relaxed;
}
.prose ul {
  @apply list-disc pl-6 mb-4 space-y-1;
}
.prose table {
  @apply w-full border-2 border-black mb-6;
}
.prose th {
  @apply bg-black text-white text-left p-3 font-bold;
}
.prose td {
  @apply border border-gray-300 p-3;
}
.prose a {
  @apply text-blue-600 underline hover:text-blue-800;
}
.prose strong {
  @apply font-bold;
}
</style>
