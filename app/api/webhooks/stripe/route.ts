import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { topUpWallet } from '@/lib/wallet/operations'
import { createAuditLog } from '@/lib/audit/logger'

// Stripe webhook handler (future integration)
// Handles payment_intent.succeeded, checkout.session.completed, etc.
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    // TODO: Verify Stripe signature
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const event = stripe.webhooks.constructEvent(body, sig!, webhookSecret!)

    // For now, parse the body directly (INSECURE — add signature verification before production)
    let event: any
    try {
      event = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { userId, paymentType, paymentId } = paymentIntent.metadata || {}

        if (!userId || !paymentId) {
          console.warn('Stripe webhook: missing metadata', paymentIntent.id)
          break
        }

        // Update payment record
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            referenceCode: paymentIntent.id,
            approvedAt: new Date(),
            approvedBy: 'STRIPE',
          },
        })

        // If wallet top-up, credit the wallet
        if (paymentType === 'WALLET_TOP_UP') {
          await topUpWallet(
            userId,
            paymentIntent.amount / 100, // Stripe amounts in cents
            `Stripe payment ${paymentIntent.id}`,
            'STRIPE'
          )
        }

        await createAuditLog({
          action: 'PAYMENT_APPROVE',
          entity: 'Payment',
          entityId: paymentId,
          userId: userId,
          details: { stripePaymentIntentId: paymentIntent.id, amount: paymentIntent.amount / 100 },
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const { paymentId } = paymentIntent.metadata || {}

        if (paymentId) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'REJECTED',
              rejectionReason: `Stripe payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
              rejectedAt: new Date(),
              rejectedBy: 'STRIPE',
            },
          })
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout session completed:', session.id)
        // Handle checkout completion if using Stripe Checkout
        break
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

