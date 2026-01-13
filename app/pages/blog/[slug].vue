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
          <p class="text-sm text-gray-500 uppercase tracking-wide mb-3">{{ post.date }}</p>
          <h1 class="text-3xl sm:text-4xl font-black leading-tight mb-4">{{ post.title }}</h1>
          <p class="text-lg text-gray-600">{{ post.excerpt }}</p>
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
  'free-surf-report-app-no-ads': {
    title: "Free Surf Report App With No Ads — Why We Built Howzit",
    date: 'January 13, 2026',
    excerpt: "Every surf app is either paywalled, ad-infested, or both. So I built something else.",
    content: `
      <p>I was mid-scroll through a surf report when a full-screen ad for car insurance popped up. Closed it. Another one. Closed that too. By the time I saw the actual forecast, I forgot why I opened the app.</p>
      
      <p>This happens constantly. The big surf apps are basically ad delivery platforms that occasionally show you wave heights.</p>
      
      <p>So I built something else.</p>
      
      <h2>The Problem With Surf Apps in 2026</h2>
      
      <p>Let's be honest about what's out there.</p>
      
      <p><strong>Surfline</strong> — The default. Decent data. But the free version is basically unusable. Ads everywhere. Half the features locked behind a $100/year paywall. And their forecasts? Single source. Black box. Trust us, bro.</p>
      
      <p><strong>Magic Seaweed</strong> — Was good. Then Surfline bought them. Now it's the same thing with a different logo.</p>
      
      <p><strong>Windy/Windfinder</strong> — Great for wind. Garbage for surf. Not built for wave riders.</p>
      
      <p><strong>Random apps</strong> — Either abandoned, full of ads, or both.</p>
      
      <p>Every option is either paywalled, ad-infested, or just not built for surfers who want to check conditions without a 30-second commitment.</p>
      
      <h2>What I Actually Wanted</h2>
      
      <p>Pretty simple list:</p>
      
      <ul>
        <li><strong>Open app. See waves.</strong> No login wall. No "watch this ad first." No "upgrade to see today's forecast."</li>
        <li><strong>Real data I can trust.</strong> Not one black-box algorithm. Show me what different models are predicting. Let me decide.</li>
        <li><strong>Works on my phone.</strong> Fast. Clean. Doesn't drain my battery running ads in the background.</li>
        <li><strong>Free.</strong> Actually free. Not "free trial" or "free with ads" or "free but the useful stuff costs money."</li>
      </ul>
      
      <p>Couldn't find it. So I made it.</p>
      
      <h2>How Howzit Works</h2>
      
      <p>We pull from three wave models — <a href="https://polar.ncep.noaa.gov/waves/" target="_blank" rel="noopener">WaveWatch III</a> (NOAA), <a href="https://www.ecmwf.int/en/forecasts" target="_blank" rel="noopener">ECMWF</a> (European), and <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>. Then we blend them.</p>
      
      <p>When all three agree, you see high confidence. When they disagree, we tell you. No pretending we know something we don't.</p>
      
      <p>Tides come from NOAA. Wind data too. Water temps. Everything's real, everything's sourced, nothing's made up.</p>
      
      <p>You can toggle between models and see exactly what each one predicts. Try doing that on Surfline.</p>
      
      <h2>Why No Ads?</h2>
      
      <p>Ads suck. That's basically it.</p>
      
      <p>But also — ads create bad incentives. When you make money from ads, you want people to spend more time in the app. So you add features that waste time. Infinite scroll. Push notifications for non-events. Anything to juice engagement.</p>
      
      <p>I want you to open Howzit, see if it's worth surfing, and close it. Done. Go live your life.</p>
      
      <h2>Why Free Then?</h2>
      
      <p>Few reasons.</p>
      
      <p><strong>Right now:</strong> I'm building an audience. Proving the concept. Getting feedback from actual surfers. Charging money before the product is dialed would be dumb.</p>
      
      <p><strong>Eventually:</strong> Premium features for people who want them. Alerts when your spot hits a certain size. Custom thresholds. Maybe multi-spot dashboards. Stuff that's actually worth paying for.</p>
      
      <p>But the core product — checking today's surf at your local break — stays free. Forever.</p>
      
      <h2>What's Covered</h2>
      
      <p>76 spots across the East Coast right now:</p>
      
      <ul>
        <li><strong>New Jersey</strong> — Manasquan, Asbury, LBI, the usual suspects</li>
        <li><strong>New York</strong> — Rockaway, Long Beach, Montauk</li>
        <li><strong>North Carolina</strong> — Outer Banks, Wrightsville, all of it</li>
        <li><strong>Florida</strong> — Jacksonville down to Miami</li>
        <li>Plus Maine, New Hampshire, Massachusetts, Rhode Island, Delaware, Maryland, Virginia, South Carolina, Georgia</li>
      </ul>
      
      <p>More coming. West Coast eventually. Hawaii probably.</p>
      
      <h2>The Tech (For Nerds)</h2>
      
      <p>Built with Nuxt.js. Data stored in Supabase. Forecasts update every 6 hours from three independent APIs.</p>
      
      <p>The rating algorithm factors in:</p>
      <ul>
        <li>Wave height (obviously)</li>
        <li>Wave period (the thing beginners ignore but matters most)</li>
        <li>Swell direction vs. beach orientation</li>
        <li>Wind speed and direction relative to the beach</li>
      </ul>
      
      <p>It's not magic. It's just math. And we show our work on the <a href="/how-we-rate">How We Forecast</a> page.</p>
      
      <h2>Try It</h2>
      
      <p>That's the pitch. Free surf reports. No ads. Multiple forecast models. Actually useful.</p>
      
      <p>Check your local spot: <a href="https://www.hwztsurf.com/spots">hwztsurf.com/spots</a></p>
      
      <p>If it sucks, tell me. Feedback link is on every page. I actually read it.</p>
    `
  },
  'how-to-read-a-surf-report': {
    title: "How to Read a Surf Report: A Beginner's Guide to Better Waves",
    date: 'January 12, 2026',
    excerpt: "Wave height, period, wind, tides — what does it all mean? Here's the guide I wish someone gave me when I started surfing.",
    content: `
      <p>You check the app. It says 3ft at 8 seconds, wind SW at 12mph. Cool. But is that... good? Should you go? What does any of it actually mean?</p>
      
      <p>I remember staring at surf reports for months before any of it clicked. Nobody explains this stuff. You're just supposed to know somehow.</p>
      
      <p>So here's the guide I wish someone gave me.</p>
      
      <h2>The Three Numbers That Matter</h2>
      
      <p>Every surf report boils down to three things: wave height, wave period, and wind. That's it. Everything else is extra.</p>
      
      <h3>Wave Height</h3>
      
      <p>This one seems obvious but it's tricky.</p>
      
      <p>When a report says "3ft," that's the <em>face height</em> of the wave — what you'd actually ride. Some apps use "significant wave height" which is a scientific measurement that often reads smaller than what you'll see at the beach.</p>
      
      <p><strong>Quick guide:</strong></p>
      <ul>
        <li><strong>1-2ft</strong> — Beginner friendly. Mellow. Good for learning.</li>
        <li><strong>3-4ft</strong> — Fun for most surfers. Solid day.</li>
        <li><strong>5-6ft</strong> — Getting serious. Intermediate+.</li>
        <li><strong>8ft+</strong> — Know what you're doing or stay on the beach.</li>
      </ul>
      
      <p>Here's the thing though — 3ft at a steep beach break hits different than 3ft at a mellow point break. Size isn't everything.</p>
      
      <h3>Wave Period</h3>
      
      <p>This is the secret sauce that beginners ignore and experienced surfers obsess over.</p>
      
      <p>Period is the time between waves, measured in seconds. It tells you how much <em>energy</em> is in the swell.</p>
      
      <p><strong>What the numbers mean:</strong></p>
      <ul>
        <li><strong>5-7 seconds</strong> — Short period. Weak, choppy, wind-generated waves. The kind that crumble and close out.</li>
        <li><strong>8-10 seconds</strong> — Medium period. Decent energy. Surfable.</li>
        <li><strong>11-14 seconds</strong> — Long period. Powerful, organized waves. Ground swell. The good stuff.</li>
        <li><strong>15+ seconds</strong> — Very long period. Usually big, powerful swells from distant storms.</li>
      </ul>
      
      <p>Here's why it matters: a 3ft wave at 14 seconds will be way more powerful and fun than a 4ft wave at 6 seconds. The 4ft wave will be junky wind chop. The 3ft wave will have push.</p>
      
      <p><strong>Rule of thumb:</strong> Anything under 8 seconds is usually not worth the drive. Anything over 12 seconds is worth rearranging your schedule.</p>
      
      <h3>Wind Speed and Direction</h3>
      
      <p>Wind can make or break a session.</p>
      
      <p><strong>Offshore wind</strong> — Blows from land toward ocean. Holds up the wave face, creates clean conditions. This is what you want.</p>
      
      <p><strong>Onshore wind</strong> — Blows from ocean toward land. Mushes everything out. Bumpy, crumbly, frustrating.</p>
      
      <p><strong>Cross-shore wind</strong> — Blows parallel to the beach. Not ideal but surfable.</p>
      
      <p><strong>Speed matters too:</strong></p>
      <ul>
        <li><strong>0-5mph</strong> — Glassy. Perfect conditions.</li>
        <li><strong>5-10mph</strong> — Light texture. Still good.</li>
        <li><strong>10-15mph</strong> — Noticeable chop if onshore.</li>
        <li><strong>15mph+</strong> — Probably blown out unless it's offshore.</li>
      </ul>
      
      <p>Early mornings are usually best because wind is lightest before the land heats up.</p>
      
      <h2>Swell Direction: The Part Everyone Forgets</h2>
      
      <p>Swell direction tells you where the waves are coming from. This matters because beaches face different directions.</p>
      
      <p>If you're at an east-facing beach and the swell is coming from the south, you might be in a "swell shadow" — the waves won't wrap into your spot.</p>
      
      <p><strong>East Coast basics:</strong></p>
      <ul>
        <li><strong>E/ESE swells</strong> — Hit most beaches directly. Usually good.</li>
        <li><strong>NE swells</strong> — Nor'easter energy. Can be powerful but often comes with bad wind.</li>
        <li><strong>SE/S swells</strong> — Hurricane swells. When these hit, pay attention.</li>
      </ul>
      
      <p>Each beach has a "swell window" — the directions it picks up best. Local knowledge helps here, or you find a forecast that accounts for it (shameless plug: we do this at <a href="https://www.hwztsurf.com">Howzit</a>).</p>
      
      <h2>Tides: The Timing Factor</h2>
      
      <p>Tides affect wave shape. Some spots work better at high tide, others at low.</p>
      
      <p><strong>General patterns:</strong></p>
      <ul>
        <li><strong>Low tide</strong> — Waves break in shallower water. Often steeper, hollower, faster. Can close out on beach breaks.</li>
        <li><strong>High tide</strong> — Waves break in deeper water. Often mushier, slower. More forgiving.</li>
        <li><strong>Mid tide</strong> — Usually the safe bet. Most spots work.</li>
        <li><strong>Moving tides</strong> — Some spots are best on incoming (rising) or outgoing (dropping) tide.</li>
      </ul>
      
      <p>Check when high and low tides are, then think about when the tide will be <em>moving</em> through the mid-range. That's often prime time.</p>
      
      <h2>Putting It All Together</h2>
      
      <p>Let's say you see this forecast:</p>
      
      <blockquote><strong>4ft at 11 seconds, SSE swell, wind W at 8mph, mid tide</strong></blockquote>
      
      <p>Breaking it down:</p>
      <ul>
        <li>4ft — Solid size, fun for most</li>
        <li>11 seconds — Good period, real energy behind it</li>
        <li>SSE swell — Coming from the south-southeast, check if your beach picks that up</li>
        <li>Wind W at 8mph — Westerly is offshore for east-facing beaches, light speed = clean</li>
        <li>Mid tide — Usually works</li>
      </ul>
      
      <p><strong>Verdict:</strong> Go. This is a good day.</p>
      
      <p>Now compare to:</p>
      
      <blockquote><strong>5ft at 6 seconds, E swell, wind E at 18mph, low tide</strong></blockquote>
      
      <p>Breaking it down:</p>
      <ul>
        <li>5ft — Sounds big but...</li>
        <li>6 seconds — Short period, junky wind swell</li>
        <li>E swell — Direct, but with that wind...</li>
        <li>Wind E at 18mph — Strong onshore. Blown out.</li>
        <li>Low tide — Probably closing out</li>
      </ul>
      
      <p><strong>Verdict:</strong> Skip it. Looks bigger on paper but conditions are trash.</p>
      
      <h2>The Beginner Cheat Sheet</h2>
      
      <p><strong>Go surfing when:</strong></p>
      <ul>
        <li>Period is 8+ seconds</li>
        <li>Wind is under 10mph (or offshore)</li>
        <li>Tide is mid or matches your spot</li>
      </ul>
      
      <p><strong>Stay home when:</strong></p>
      <ul>
        <li>Period is under 7 seconds</li>
        <li>Wind is onshore 15mph+</li>
        <li>Report says "choppy" or "blown out"</li>
      </ul>
      
      <p><strong>Best conditions for learning:</strong></p>
      <ul>
        <li>2-3ft</li>
        <li>10+ second period (mellow power)</li>
        <li>Light wind or offshore</li>
        <li>Mid to high tide</li>
      </ul>
      
      <h2>One More Thing</h2>
      
      <p>Forecasts are predictions, not guarantees. Models disagree with each other constantly — sometimes by 2-3ft for the same spot.</p>
      
      <p>That's actually why we built <a href="https://www.hwztsurf.com">Howzit</a>. We pull from three different forecast models and show you when they agree (high confidence) vs. when they're all over the place (low confidence).</p>
      
      <p>Check the report, but also check the cams. And when in doubt, just go look. Sometimes the best sessions happen when the forecast looks meh.</p>
    `
  },
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
      
      <p><strong><a href="https://polar.ncep.noaa.gov/waves/" target="_blank" rel="noopener">WaveWatch III</a></strong> — NOAA runs this one. Been around since the 90s. American model, uses our weather data. Pretty good at catching swells early and tracking short-period stuff.</p>
      
      <p><strong><a href="https://www.ecmwf.int/en/forecasts" target="_blank" rel="noopener">ECMWF WAM</a></strong> — European model. These are the folks who <a href="https://www.washingtonpost.com/news/capital-weather-gang/wp/2012/10/26/hurricane-sandy-why-the-european-model-was-more-accurate/" target="_blank" rel="noopener">nailed Hurricane Sandy</a> when American models had it going out to sea. Generally solid for 3-7 days out.</p>
      
      <p><strong><a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></strong> — Open source thing that pulls from multiple places. Decent baseline, lots of detail on swell components.</p>
      
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
