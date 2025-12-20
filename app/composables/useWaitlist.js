export const useWaitlist = () => {
  const activeUsers = useState('activeUsers', () => 2847)
  
  const incrementUsers = () => {
    activeUsers.value++
  }
  
  onMounted(() => {
    const target = activeUsers.value
    const start = target - 200
    activeUsers.value = start
    
    const duration = 2000
    const increment = (target - start) / (duration / 16)
    
    const animate = () => {
      if (activeUsers.value < target) {
        activeUsers.value = Math.min(activeUsers.value + increment, target)
        requestAnimationFrame(animate)
      } else {
        activeUsers.value = target
      }
    }
    
    animate()
  })
  
  return {
    activeUsers: readonly(activeUsers),
    incrementUsers
  }
}
