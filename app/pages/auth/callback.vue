<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-lg font-bold">Signing you in...</p>
      <p class="text-gray-500 text-sm mt-2">Hold tight.</p>
    </div>
  </div>
</template>

<script setup>
// This page handles the OAuth callback redirect from Google/etc.
// @nuxtjs/supabase automatically picks up the auth tokens from the URL hash.
// We just need to wait for the session to be established, then redirect.

const user = useSupabaseUser()

watch(user, (val) => {
  if (val) {
    navigateTo('/spots')
  }
}, { immediate: true })

// Fallback: if user doesn't populate within 5 seconds, redirect to login
onMounted(() => {
  setTimeout(() => {
    if (!user.value) {
      navigateTo('/login')
    }
  }, 5000)
})
</script>
