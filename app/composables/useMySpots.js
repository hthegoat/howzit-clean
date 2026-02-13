// composables/useMySpots.js
// Manage user's favorite/followed spots

export const useMySpots = () => {
  const supabase = useSupabaseClient()
  const { isLoggedIn } = useAuth()
  
  // Get userId safely (handles both JWT payload and user object)
  const user = useSupabaseUser()
  const userId = computed(() => user.value?.id || user.value?.sub || null)

  const mySpots = useState('my-spots', () => [])
  const loading = useState('my-spots-loading', () => false)

  // Fetch all user's favorite spot IDs
  const fetchMySpots = async () => {
    if (!userId.value) {
      mySpots.value = []
      return
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('user_spots')
        .select('spot_id, created_at, spots(id, name, slug, state, region, latitude, longitude)')
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false })

      if (data) {
        mySpots.value = data.map(d => ({
          spotId: d.spot_id,
          followedAt: d.created_at,
          ...d.spots
        }))
      }
    } catch (e) {
      console.error('Failed to fetch my spots:', e)
    } finally {
      loading.value = false
    }
  }

  // Check if a specific spot is followed
  const isFollowing = (spotId) => {
    return mySpots.value.some(s => s.spotId === spotId || s.id === spotId)
  }

  // Follow a spot
  const followSpot = async (spotId) => {
    if (!userId.value) return false

    try {
      const { error } = await supabase
        .from('user_spots')
        .insert({ user_id: userId.value, spot_id: spotId })

      if (error) {
        // Already following (unique constraint)
        if (error.code === '23505') return true
        throw error
      }

      await fetchMySpots()
      return true
    } catch (e) {
      console.error('Failed to follow spot:', e)
      return false
    }
  }

  // Unfollow a spot
  const unfollowSpot = async (spotId) => {
    if (!userId.value) return false

    try {
      const { error } = await supabase
        .from('user_spots')
        .delete()
        .eq('user_id', userId.value)
        .eq('spot_id', spotId)

      if (error) throw error

      await fetchMySpots()
      return true
    } catch (e) {
      console.error('Failed to unfollow spot:', e)
      return false
    }
  }

  // Toggle follow/unfollow
  const toggleFollow = async (spotId) => {
    if (isFollowing(spotId)) {
      return await unfollowSpot(spotId)
    } else {
      return await followSpot(spotId)
    }
  }

  // Load on auth change
  watch(userId, async (newId) => {
    if (newId) {
      await fetchMySpots()
    } else {
      mySpots.value = []
    }
  }, { immediate: true })

  return {
    mySpots,
    loading,
    isFollowing,
    followSpot,
    unfollowSpot,
    toggleFollow,
    fetchMySpots
  }
}
