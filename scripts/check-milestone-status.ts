import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Running milestone status check...')
  
  const now = new Date()
  
  // 1. Mark DUE milestones as OVERDUE if their due date is in the past
  const overdueMilestones = await prisma.paymentMilestone.updateMany({
    where: {
      status: 'DUE',
      dueDate: {
        lt: now
      }
    },
    data: {
      status: 'OVERDUE'
    }
  })
  
  console.log(`Marked ${overdueMilestones.count} milestones as OVERDUE.`)

  // 2. Find ACTIVE full-time enrollments where a milestone is overdue by more than 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const atRiskEnrollments = await prisma.fullTimeEnrollment.findMany({
    where: {
      status: 'ACTIVE',
      milestones: {
        some: {
          status: 'OVERDUE',
          dueDate: {
            lt: thirtyDaysAgo
          }
        }
      }
    }
  })

  if (atRiskEnrollments.length > 0) {
    console.log(`Found ${atRiskEnrollments.length} enrollments to mark as AT_RISK.`)
    
    for (const enrollment of atRiskEnrollments) {
      await prisma.fullTimeEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'AT_RISK' }
      })
      console.log(`Marked enrollment ${enrollment.id} as AT_RISK.`)
    }
  } else {
    console.log('No enrollments need to be marked as AT_RISK.')
  }

  console.log('Milestone status check complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



