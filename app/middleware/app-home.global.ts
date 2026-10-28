// The marketing homepage is the wrong launch screen for an app. Someone who
// installed it has already been sold; they want the spot list, and they want
// it one tap from the icon. Web behaviour is untouched — this only fires when
// BUILD_TARGET=app baked isApp into the runtime config.
export default defineNuxtRouteMiddleware((to) => {
  const { isApp } = useRuntimeConfig().public
  if (!isApp) return
  if (to.path === '/') return navigateTo('/spots', { replace: true })
})
