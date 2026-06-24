import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { renderEmail } from '@/lib/emailTemplates'
import { appUrl } from '@/lib/resend'
import { getMemberPortalToken } from '@/services/orders'
import { format } from 'date-fns'

/**
 * Remind members with an order in this pickup event's quarter that their cider is
 * ready. Admin-triggered. Skips cancelled orders.
 */
export async function sendPickupReminders(
  pickupEventId: string
): Promise<{ sent: number }> {
  const event = await prisma.pickupEvent.findUniqueOrThrow({
    where: { id: pickupEventId },
    include: { quarter: true },
  })

  const orders = await prisma.order.findMany({
    where: { quarterId: event.quarterId, status: { notIn: ['CANCELLED'] } },
    include: { member: true },
  })

  const pickupDate = `${format(new Date(event.startsAt), 'EEEE, MMMM d · h:mma')}–${format(new Date(event.endsAt), 'h:mma')}`
  const pickupLocation = event.location ?? 'See your portal for details'

  let sent = 0
  for (const order of orders) {
    const token = await getMemberPortalToken(order.member.id)
    const email = await renderEmail('PICKUP_REMINDER', {
      firstName: order.member.firstName,
      quarterLabel: event.quarter.label,
      pickupDate,
      pickupLocation,
      portalUrl: `${appUrl}/magic?t=${token}&next=/member/orders/${order.id}`,
    })
    await sendEmail({
      to: order.member.email,
      subject: email.subject,
      html: email.html,
      type: 'PICKUP_REMINDER',
      memberId: order.member.id,
      metadata: { pickupEventId },
    })
    sent++
  }

  return { sent }
}

/**
 * Announce a standalone club event to all members who opted into event alerts.
 * Admin-triggered from /admin/events/[eventId].
 */
export async function sendClubEventAlert(
  clubEventId: string
): Promise<{ sent: number }> {
  const event = await prisma.clubEvent.findUniqueOrThrow({
    where: { id: clubEventId },
  })

  const members = await prisma.member.findMany({
    where: { status: 'ACTIVE', eventAlertsOptIn: true },
  })

  const eventDate = event.endsAt
    ? `${format(new Date(event.startsAt), 'EEEE, MMMM d · h:mma')}–${format(new Date(event.endsAt), 'h:mma')}`
    : format(new Date(event.startsAt), 'EEEE, MMMM d · h:mma')

  let sent = 0
  for (const member of members) {
    const token = await getMemberPortalToken(member.id)
    const email = await renderEmail('EVENT_ALERT', {
      firstName: member.firstName,
      eventTitle: event.title,
      eventDate,
      eventLocation: event.location ?? 'The Cider House',
      eventDetails: event.description ?? event.notes ?? '',
      portalUrl: `${appUrl}/member/events`,
    })
    await sendEmail({
      to: member.email,
      subject: email.subject,
      html: email.html,
      type: 'EVENT_ALERT',
      memberId: member.id,
      metadata: { clubEventId },
    })
    sent++
  }

  return { sent }
}

/**
 * Announce a pickup event as a club event to all members who opted into event
 * alerts. Admin-triggered.
 */
export async function sendEventAlert(
  pickupEventId: string
): Promise<{ sent: number }> {
  const event = await prisma.pickupEvent.findUniqueOrThrow({
    where: { id: pickupEventId },
  })

  const members = await prisma.member.findMany({
    where: { status: 'ACTIVE', eventAlertsOptIn: true },
  })

  const eventDate = `${format(new Date(event.startsAt), 'EEEE, MMMM d · h:mma')}–${format(new Date(event.endsAt), 'h:mma')}`

  let sent = 0
  for (const member of members) {
    const token = await getMemberPortalToken(member.id)
    const email = await renderEmail('EVENT_ALERT', {
      firstName: member.firstName,
      eventTitle: event.title,
      eventDate,
      eventLocation: event.location ?? 'The Cider House',
      eventDetails: event.notes ?? '',
      portalUrl: `${appUrl}/magic?t=${token}`,
    })
    await sendEmail({
      to: member.email,
      subject: email.subject,
      html: email.html,
      type: 'EVENT_ALERT',
      memberId: member.id,
      metadata: { pickupEventId },
    })
    sent++
  }

  return { sent }
}
