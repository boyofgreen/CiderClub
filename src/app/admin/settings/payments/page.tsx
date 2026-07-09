import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { resolveRequestOrgId } from '@/lib/tenantRequest'
import { DEFAULT_ORG_ID } from '@/lib/tenantHost'
import { listLocationsForOrg } from '@/services/square/oauth'
import { PaymentsSettings } from './PaymentsSettings'

export const metadata = { title: 'Payments — Settings' }
export const dynamic = 'force-dynamic'

export default async function PaymentsSettingsPage() {
  const orgId = (await resolveRequestOrgId()) ?? DEFAULT_ORG_ID
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      squareMerchantId: true,
      squareLocationId: true,
      squareAccessToken: true,
      squareTokenExpiresAt: true,
    },
  })

  const oauthConnected = Boolean(org.squareAccessToken)
  const legacyEnvFallback =
    !oauthConnected && orgId === DEFAULT_ORG_ID && Boolean(config.square.accessToken)

  const locations = oauthConnected
    ? await listLocationsForOrg(orgId).catch(() => [])
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Payments</h1>
        <p className="mt-1 text-sm text-stone-600">
          Connect your own Square account. Member cards, charges, orders, and inventory all
          run through it — the club platform never touches your money.
        </p>
      </div>
      <PaymentsSettings
        oauthConnected={oauthConnected}
        legacyEnvFallback={legacyEnvFallback}
        merchantId={org.squareMerchantId}
        locationId={org.squareLocationId}
        tokenExpiresAt={org.squareTokenExpiresAt?.toISOString() ?? null}
        locations={locations}
      />
    </div>
  )
}
