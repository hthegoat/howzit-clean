export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
  ],

  site: {
    url: 'https://howzit.surf',
  },

  sitemap: {
    sources: [
      '/api/__sitemap__/urls'
    ]
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
      title: 'Howzit - Surf Forecasts That Don\'t Suck',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Real-time surf reports. No ads. No bloat. No BS.' }
      ]
    }
  }
})
