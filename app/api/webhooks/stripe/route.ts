import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { topUpWallet } from '@/lib/wallet/operations'
import { createAuditLog } from '@/lib/audit/logger'
import Stripe from 'stripe'

/**
 * Stripe webhook handler.
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to be set.
 * All events are verified via signature before processing.
 */
export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe integration not configured' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(stripeSecretKey)

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // Verify webhook signature — rejects tampered/forged payloads
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { userId, paymentType, paymentId } = paymentIntent.metadata || {}

        if (!userId || !paymentId) {
          console.warn('Stripe webhook: missing metadata', paymentIntent.id)
          break
        }

        // Idempotency: skip if payment already approved
        const existing = await prisma.payment.findUnique({ where: { id: paymentId } })
        if (!existing || existing.status === 'APPROVED') {
          console.log(`Stripe webhook: payment ${paymentId} already processed or not found`)
          break
        }

        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            referenceCode: paymentIntent.id,
            approvedAt: new Date(),
            approvedBy: 'STRIPE',
          },
        })

        if (paymentType === 'WALLET_TOP_UP') {
          await prisma.$transaction(async (tx) => {
            await topUpWallet(
              tx,
              userId,
              paymentIntent.amount / 100,
              `Stripe payment ${paymentIntent.id}`,
              paymentId,
              'PAYMENT_ID'
            )
          })
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
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { paymentId } = paymentIntent.metadata || {}

        if (paymentId) {
          // Idempotency: skip if already rejected
          const existing = await prisma.payment.findUnique({ where: { id: paymentId } })
          if (existing && existing.status === 'PENDING') {
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
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)
        break
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
