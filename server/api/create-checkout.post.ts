import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  
  // Get the authenticated user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  // serverSupabaseUser may return JWT payload (sub) or user object (id)
  const userId = user.id || user.sub
  const userEmail = user.email

  // Get the requested plan from body
  const body = await readBody(event)
  const plan = body?.plan || 'pro'

  const isFounding = plan === 'founding'
  const priceId = isFounding
    ? 'price_1T06sOPJcce2mR0GW1gxm80y'  // $99 one-time founding
    : (process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_1T06ojPJcce2mR0Gq7R3stSg')  // $10/year pro

  // Check if user already has a stripe_customer_id
  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  let customerId = profile?.stripe_customer_id

  // Create Stripe customer if they don't have one
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { supabase_user_id: userId }
    })
    customerId = customer.id

    // Save customer ID to profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  // Create checkout session
  const sessionParams = {
    customer: customerId,
    mode: isFounding ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.SITE_URL || 'https://hwztsurf.com'}/account?upgraded=true`,
    cancel_url: `${process.env.SITE_URL || 'https://hwztsurf.com'}/pricing`,
    metadata: {
      supabase_user_id: userId,
      plan: isFounding ? 'founding' : 'pro'
    }
  }

  // Only add subscription_data for recurring plans
  if (!isFounding) {
    sessionParams.subscription_data = {
      metadata: {
        supabase_user_id: userId
      }
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return { url: session.url }
})
