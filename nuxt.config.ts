export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
  ],

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

  // ISR: cache pages at the edge, revalidate in the background
  routeRules: {
    // Spot pages - cache 15 min, serve stale while revalidating
    '/spots/**': { isr: 900 },
    // Blog posts - cache 1 hour
    '/blog/**': { isr: 3600 },
    // Static pages - cache 1 day
    '/about': { isr: 86400 },
    '/how-we-rate': { isr: 86400 },
    '/waitlist': { isr: 86400 },
    // Homepage - cache 30 min
    '/': { isr: 1800 },
  },

  css: ['@/assets/css/main.css'],

  supabase: {
    redirect: false
  },

  googleFonts: {
    families: {
      'DM Sans': [400, 500, 600, 700, 800, 900],
      'JetBrains Mono': [400, 500, 600],
    },
    display: 'swap',
    preload: true,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Howzit - Surf Forecasts That Don\'t Suck',
      script: [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-VKCEL7TEGB',
          async: true
        },
        {
          innerHTML: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-VKCEL7TEGB');`
        }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Real-time surf reports. No ads. No bloat. No BS.' },
        { name: 'theme-color', content: '#FACC15' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }
      ]
    }
  }
})
