// Runs before each test file's imports. Environment must be set here because
// several modules (lib/resend, lib/square) read process.env at import time.
process.env.NEXT_PUBLIC_APP_URL = 'http://test.local'
process.env.NEXT_PUBLIC_CLUB_NAME = 'Test Cider Club'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.SQUARE_LOCATION_ID = 'TEST_LOCATION'
// No Resend key → sendEmail() skips the network call but still writes EmailLog
delete process.env.RESEND_API_KEY
delete process.env.ADMIN_EMAILS

import { initTestDb } from './helpers/prismaTestClient'

await initTestDb()
