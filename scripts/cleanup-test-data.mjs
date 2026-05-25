// Deletes all test data: orders, quarters, members.
// Plans are left untouched.
//
// Run with:
//   DATABASE_URL="postgresql://..." node scripts/cleanup-test-data.mjs

import { PrismaClient } from '../node_modules/prisma-generated/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting cleanup...')

  // 1. PickupAttendance — references Member + PickupEvent (no cascade)
  const pa = await prisma.pickupAttendance.deleteMany()
  console.log(`Deleted ${pa.count} PickupAttendance records`)

  // 2. Orders — references Member, Quarter, PickupEvent (OrderItems cascade)
  const orders = await prisma.order.deleteMany()
  console.log(`Deleted ${orders.count} Order records (OrderItems cascade)`)

  // 3. PickupEvents — references Quarter (now safe, no Orders pointing at them)
  const pe = await prisma.pickupEvent.deleteMany()
  console.log(`Deleted ${pe.count} PickupEvent records`)

  // 4. Quarters — QuarterProduct + QuarterPlanDefault cascade
  const quarters = await prisma.quarter.deleteMany()
  console.log(`Deleted ${quarters.count} Quarter records`)

  // 5. EmailLogs — references Member (optional, but no cascade — delete before members)
  const emails = await prisma.emailLog.deleteMany()
  console.log(`Deleted ${emails.count} EmailLog records`)

  // 6. WaitlistEntries — references Member (optional)
  const waitlist = await prisma.waitlistEntry.deleteMany()
  console.log(`Deleted ${waitlist.count} WaitlistEntry records`)

  // 7. Null self-referential referredBy before deleting members
  await prisma.member.updateMany({ data: { referredByMemberId: null } })

  // 8. Members — MemberTokens cascade
  const members = await prisma.member.deleteMany()
  console.log(`Deleted ${members.count} Member records (MemberTokens cascade)`)

  console.log('\nDone. Plans preserved.')
  const plans = await prisma.plan.findMany({ select: { name: true } })
  console.log('Remaining plans:', plans.map(p => p.name).join(', '))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
