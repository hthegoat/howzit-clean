// composables/useAuth.js
// Centralized auth state + subscription tier logic

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Profile data (tier, stripe info)
  const profile = useState('user-profile', () => null)
  const profileLoading = useState('profile-loading', () => false)

  const isLoggedIn = computed(() => !!user.value)
  const userId = computed(() => user.value?.id || user.value?.sub || null)
  const userEmail = computed(() => user.value?.email || null)
  const tier = computed(() => profile.value?.tier || 'free')
  const isProUser = computed(() => tier.value === 'pro' || tier.value === 'founding')
  const isFoundingMember = computed(() => tier.value === 'founding')

  // Fetch profile from Supabase
  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null
      return
    }

    profileLoading.value = true
    try {
      const uid = userId.value
      const email = userEmail.value
      if (!uid) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — create it
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: uid,
            email: email,
            tier: 'free'
          })
          .select()
          .single()

        profile.value = newProfile
      } else if (data) {
        profile.value = data
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e)
    } finally {
      profileLoading.value = false
    }
  }

  // Sign in with email + password
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    await fetchProfile()
    return data
  }

  // Sign up with email + password
  const signUpWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    })
    if (error) throw error
    return data
  }

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    profile.value = null
    await navigateTo('/')
  }

  // Watch for auth state changes
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchProfile()
    } else {
      profile.value = null
    }
  }, { immediate: true })

  return {
    user,
    profile,
    profileLoading,
    isLoggedIn,
    tier,
    isProUser,
    isFoundingMember,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    fetchProfile
  }
}
