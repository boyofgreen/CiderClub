import { describe, it, expect } from 'vitest'
import { parseTenantHost } from '@/lib/tenantHost'

const ROOT = 'cideryclub.app'

describe('parseTenantHost', () => {
  it('treats the root domain and www as platform requests', () => {
    expect(parseTenantHost('cideryclub.app', ROOT)).toEqual({ type: 'platform' })
    expect(parseTenantHost('www.cideryclub.app', ROOT)).toEqual({ type: 'platform' })
    expect(parseTenantHost('CideryClub.App:443', ROOT)).toEqual({ type: 'platform' })
  })

  it('extracts the tenant slug from a subdomain', () => {
    expect(parseTenantHost('bluebird.cideryclub.app', ROOT)).toEqual({
      type: 'subdomain',
      slug: 'bluebird',
    })
    expect(parseTenantHost('Bluebird.CIDERYCLUB.app:3000', ROOT)).toEqual({
      type: 'subdomain',
      slug: 'bluebird',
    })
  })

  it('does not treat www or nested subdomains as tenant slugs', () => {
    expect(parseTenantHost('www.bluebird.cideryclub.app', ROOT)).toEqual({ type: 'platform' })
  })

  it('treats unrelated hosts as tenant custom domains', () => {
    expect(parseTenantHost('club.bluebirdcidery.com', ROOT)).toEqual({
      type: 'custom-domain',
      domain: 'club.bluebirdcidery.com',
    })
  })

  it('handles localhost development', () => {
    expect(parseTenantHost('localhost:3000', 'localhost')).toEqual({ type: 'platform' })
    expect(parseTenantHost('bluebird.localhost:3000', 'localhost')).toEqual({
      type: 'subdomain',
      slug: 'bluebird',
    })
  })

  it('falls back to platform when Host is missing', () => {
    expect(parseTenantHost(null, ROOT)).toEqual({ type: 'platform' })
    expect(parseTenantHost(undefined, ROOT)).toEqual({ type: 'platform' })
  })
})
