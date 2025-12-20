import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
    try {
        const { data: spots, error } = await supabase.from('spots').select('id, name')
        if (error || !spots) {
            return new Response(JSON.stringify({ error: 'Failed to fetch spots' }), { status: 500 })
        }

        const results = []

        for (const spot of spots) {
            try {
                const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-spot-summary`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ spot_id: spot.id })
                })
                const result = await response.json()
                results.push({ spot: spot.name, status: response.ok ? 'success' : 'failed' })
                await new Promise(r => setTimeout(r, 500))
            } catch {
                results.push({ spot: spot.name, status: 'error' })
            }
        }

        return new Response(JSON.stringify({ processed: spots.length, results }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }), { status: 500 })
    }
})
