// Stripe integration placeholder
// TODO: Install stripe package and configure

export async function createPaymentIntent(amount: number, currency: string = 'eur', metadata: Record<string, string> = {}) {
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // return stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency, metadata })
  console.log('[STRIPE] Payment intent would be created:', { amount, currency, metadata })
  return { id: `pi_placeholder_${Date.now()}`, client_secret: 'placeholder' }
}

export async function verifyWebhookSignature(payload: string, signature: string) {
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  console.log('[STRIPE] Webhook verification placeholder')
  return JSON.parse(payload)
}
