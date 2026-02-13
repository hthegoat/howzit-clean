<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
    <AppHeader />
    
    <main class="max-w-md mx-auto px-3 sm:px-6 py-16 sm:py-24">
      <div class="text-center mb-8">
        <h1 class="text-3xl sm:text-4xl font-black uppercase mb-2">
          {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
        </h1>
        <p class="text-gray-600">
          {{ isSignUp ? 'Start tracking swells like a pro.' : 'Sign in to access your forecast.' }}
        </p>
      </div>

      <BrutalCard class="p-6 sm:p-8">
        <!-- Google OAuth -->
        <button
          @click="handleGoogle"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 bg-white text-black font-bold px-4 py-3 border-2 border-black rounded-[6px] hover:bg-gray-50 transition-colors mb-6"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <!-- Divider -->
        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t-2 border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white px-4 text-gray-500 font-medium">or</span>
          </div>
        </div>

        <!-- Email/Password Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-bold uppercase mb-1">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-3 border-2 border-black rounded-[6px] focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-bold uppercase mb-1">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="6"
              placeholder="••••••••"
              class="w-full px-4 py-3 border-2 border-black rounded-[6px] focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <!-- Error message -->
          <div v-if="error" class="bg-red-50 border-2 border-red-300 rounded-[6px] p-3 text-sm text-red-700">
            {{ error }}
          </div>

          <!-- Success message (for sign up) -->
          <div v-if="success" class="bg-green-50 border-2 border-green-300 rounded-[6px] p-3 text-sm text-green-700">
            {{ success }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-yellow-400 text-black font-bold px-6 py-3 text-lg border-2 border-black rounded-[6px] sm:shadow-[4px_4px_0px_#000] sm:hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {{ loading ? 'Loading...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN') }}
          </button>
        </form>

        <!-- Toggle sign in / sign up -->
        <p class="text-center text-sm text-gray-600 mt-6">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <button
            @click="toggleMode"
            class="font-bold text-black underline hover:text-yellow-600 ml-1"
          >
            {{ isSignUp ? 'Sign in' : 'Sign up' }}
          </button>
        </p>
      </BrutalCard>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
const { signInWithEmail, signUpWithEmail, signInWithGoogle, isLoggedIn } = useAuth()

const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

// Redirect if already logged in
watch(isLoggedIn, (val) => {
  if (val) navigateTo('/spots')
}, { immediate: true })

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = ''
  success.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (isSignUp.value) {
      await signUpWithEmail(email.value, password.value)
      success.value = 'Check your email for a confirmation link!'
    } else {
      await signInWithEmail(email.value, password.value)
      await navigateTo('/spots')
    }
  } catch (e) {
    error.value = e.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}

const handleGoogle = async () => {
  loading.value = true
  error.value = ''
  try {
    await signInWithGoogle()
  } catch (e) {
    error.value = e.message || 'Google sign-in failed'
    loading.value = false
  }
}

useHead({
  title: 'Sign In - Howzit',
  meta: [
    { name: 'description', content: 'Sign in to Howzit for extended surf forecasts and premium features.' }
  ]
})
</script>
