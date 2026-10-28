import { serverSupabaseServiceRole } from '#supabase/server'

// Everything /status shows comes from one SQL function, get_pipeline_status()
// (supabase/migrations/2026-10-20-pipeline-status.sql). Add a check there and
// it appears on the page with no frontend change.
export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase.rpc('get_pipeline_status')
  if (error) throw createError({ statusCode: 500, message: error.message })

  setHeader(event, 'Cache-Control', 'no-store')
  return data
})
