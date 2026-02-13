import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Get raw body for signature verification
  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    throw createError({ statusCode: 400, message: `Webhook Error: ${err.message}` })
  }

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  switch (stripeEvent.type) {
    // Checkout completed — activate pro
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      
      if (userId && plan === 'founding') {
        // One-time founding member payment
        await supabase
          .from('profiles')
          .update({
            tier: 'founding',
            stripe_customer_id: session.customer
          })
          .eq('id', userId)
        
        console.log(`User ${userId} became a founding member`)
      } else if (userId && session.subscription) {
        // Recurring pro subscription
        await supabase
          .from('profiles')
          .update({
            tier: 'pro',
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer
          })
          .eq('id', userId)
        
        console.log(`Upgraded user ${userId} to pro`)
      }
      break
    }

    // Subscription updated (renewal, plan change)
    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object
      const userId = subscription.metadata?.supabase_user_id

      if (userId) {
        const isActive = ['active', 'trialing'].includes(subscription.status)
        
        await supabase
          .from('profiles')
          .update({
            tier: isActive ? 'pro' : 'free'
          })
          .eq('id', userId)

        console.log(`Subscription updated for ${userId}: ${subscription.status} → ${isActive ? 'pro' : 'free'}`)
      }
      break
    }

    // Subscription deleted (cancelled / expired)
    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object
      const userId = subscription.metadata?.supabase_user_id

      if (userId) {
        // Don't downgrade founding members
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', userId)
          .single()

        if (profile?.tier !== 'founding') {
          await supabase
            .from('profiles')
            .update({
              tier: 'free',
              stripe_subscription_id: null
            })
            .eq('id', userId)

          console.log(`Downgraded user ${userId} to free`)
        }
      }
      break
    }

    // Invoice payment failed
    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object
      console.log(`Payment failed for customer ${invoice.customer}`)
      break
    }
  }

  return { received: true }
})
