// BUILD_TARGET=app switches this config into Capacitor mode: no SSR, no
// server routes, no SEO machinery, fonts bundled locally rather than fetched.
// Unset (the default) leaves the web build exactly as it was — every branch
// below collapses back to the original value, so `npm run build` is unchanged.
const isApp = process.env.BUILD_TARGET === 'app'

// Pages that cannot or should not ship inside the app bundle:
//   blog/**   needs @nuxt/content, which needs prerendering we're not doing
//   open      calls /api/open-stats, and there is no server in a static bundle
//   login/account/auth  auth was removed in Aug; the files are still on disk
//   waitlist  dead route, web redirects it at the edge
//   status    calls /api/status, same reason as open
const APP_EXCLUDED_PAGES = [
  /^\/blog/,
  /^\/open$/,
  /^\/status$/,
  /^\/login$/,
  /^\/account$/,
  /^\/auth/,
  /^\/waitlist$/,
]

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  ssr: !isApp,

  modules: [
    // Both of these assume a server. Dropping them from the app build also
    // drops the only reason the blog pages would need to compile.
    ...(isApp ? [] : ['@nuxt/content', '@nuxtjs/sitemap']),
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/supabase',
  ],

  hooks: {
    'pages:extend'(pages) {
      if (!isApp) return
      // Splice in place — reassigning the array does nothing, Nuxt keeps the
      // reference it handed us.
      for (let i = pages.length - 1; i >= 0; i--) {
        if (APP_EXCLUDED_PAGES.some(re => re.test(pages[i].path))) {
          pages.splice(i, 1)
        }
      }
    }
  },

  content: {
    highlight: {
      theme: 'github-dark'
    },
    markdown: {
      anchorLinks: false
    }
  },

  site: {
    url: 'https://hwztsurf.com',
  },

  sitemap: {
    sources: [
      '/api/__sitemap__/urls'
    ]
  },

  // ISR is an edge-cache instruction. There is no edge inside a phone, and
  // leaving these on breaks a static build, so the app target gets none.
  routeRules: isApp ? {} : {
    // Spot pages - cache 15 min, serve stale while revalidating
    '/spots/**': { isr: 900 },
    // Blog posts - cache 1 hour
    '/blog/**': { isr: 3600 },
    // Static pages - cache 1 day
    '/about': { isr: 86400 },
    '/how-we-rate': { isr: 86400 },
    // Removed pages — 301 to spots
    '/waitlist': { redirect: { to: '/spots', statusCode: 301 } },
    '/pricing': { redirect: { to: '/spots', statusCode: 301 } },
    '/open': { isr: 900 },
    // Pipeline status: always live, never indexed
    '/status': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/api/status': { headers: { 'Cache-Control': 'no-store' } },
    '/changelog': { isr: 86400 },
    // Homepage - cache 30 min
    '/': { isr: 1800 },
    // Auth pages - no cache (dynamic)
    '/login': { ssr: false },
    '/account': { ssr: false },
    '/auth/**': { ssr: false },

  },

  css: ['@/assets/css/main.css'],

  // Static SPA shell. crawlLinks would otherwise walk into all 149 spot pages
  // and try to prerender them, which defeats the point — the app fetches live.
  nitro: isApp
    ? { prerender: { crawlLinks: false, routes: ['/'] } }
    : {},

  runtimeConfig: {
    public: {
      // Read by app-only client code (home redirect now, push + offline next).
      isApp
    }
  },

  supabase: {
    redirect: false,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  googleFonts: {
    families: {
      'DM Sans': [400, 500, 600, 700, 800, 900],
      'JetBrains Mono': [400, 500, 600],
    },
    display: 'swap',
    preload: true,
    // Bundle the font files into the app instead of fetching them from
    // Google at runtime. Non-negotiable for the offline requirement, and it
    // avoids a third-party network call from inside the WebView.
    download: isApp,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
        // Gates the safe-area and no-select rules in main.css to the native
        // shell, so the web build is completely unaffected by them.
        ...(isApp ? { class: 'capacitor-app' } : {})
      },
      title: 'Howzit | Free Surf Report & Surf Forecast for 149 US Spots',
      // Google Analytics is a web concern. Loading gtag inside a WebView
      // reports garbage sessions and is a privacy-label liability at review.
      script: isApp ? [] : [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-VKCEL7TEGB',
          async: true
        },
        {
          innerHTML: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-VKCEL7TEGB');`
        },

      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: isApp
          // viewport-fit=cover lets the layout reach under the notch; the
          // safe-area insets in main.css put the content back where it belongs.
          ? 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'
          : 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Free surf reports and forecasts for 149 spots across 17 states. Real-time wave heights, swell period, wind, tides, and AI-powered surf conditions. No ads, no paywall.' },
        { name: 'theme-color', content: '#FACC15' },
        { name: 'apple-mobile-web-app-title', content: 'Howzit' },
        // Open Graph defaults (overridden per-page)
        { property: 'og:site_name', content: 'Howzit' },
        { property: 'og:image', content: 'https://hwztsurf.com/images/og-default.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://hwztsurf.com/images/og-default.png' },
        { name: 'twitter:site', content: '@howzitsurf' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  }
})
