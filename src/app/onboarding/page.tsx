import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { NewOrgForm } from './NewOrgForm'

export const metadata = { title: 'Create your club — Cidery Club Platform' }

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/onboarding')
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Create your club</h1>
          <p className="mt-2 text-stone-600">
            Set up your winery or cidery&apos;s member club. You can connect Square and
            customize everything afterward.
          </p>
        </div>
        <NewOrgForm />
      </div>
    </main>
  )
}
