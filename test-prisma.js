import 'dotenv/config'
import prisma from './lib/prisma/client.js'

async function main() {
  console.log('Verifying Global HandshakeQueue (Parallel Cold-Start Burst Simulation)...')
  const startTotal = Date.now()

  try {
    console.log('Firing 5 parallel queries simultaneously...')
    // In a cold start, these would normally trigger 5 concurrent handshakes and 08P01 errors.
    // With our new client extension, they should be queued automatically.
    const results = await Promise.all([
      prisma.user.findFirst({ select: { id: true } }),
      prisma.enrollment.findFirst({ select: { id: true } }),
      prisma.payment.findFirst({ select: { id: true } }),
      prisma.message.findFirst({ select: { id: true } }),
      prisma.class.findFirst({ select: { id: true } }),
    ])

    console.log('All parallel queries completed successfully!')
    console.log(`Total duration (including cold-start serialization): ${Date.now() - startTotal}ms`)
  } catch (error) {
    console.error('Handshake Queue failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
