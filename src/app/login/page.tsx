'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Beer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

const clubName = process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'

const errorMessages: Record<string, string> = {
  not_a_member: 'No membership found for that account. Please sign up first, or use your email link.',
  OAuthAccountNotLinked: 'This email is already registered with a different sign-in method.',
  Default: 'There was a problem signing you in. Please try again.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') ?? '/member/dashboard'

  const errorMsg = errorParam ? (errorMessages[errorParam] ?? errorMessages.Default) : null

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Beer className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900">{clubName}</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-stone-900 text-center mb-2">Sign in</h1>
          <p className="text-sm text-stone-500 text-center mb-6">
            Admin portal sign-in via Google or Facebook
          </p>

          {errorMsg && <Alert type="error" message={errorMsg} className="mb-4" />}

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => signIn('google', { callbackUrl })}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => signIn('facebook', { callbackUrl })}
            >
              <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>

          <div className="mt-6 text-center border-t border-stone-100 pt-5">
            <p className="text-sm text-stone-500">
              Member? Use your email link instead.
            </p>
            <Link
              href="/magic/request"
              className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Get my access link →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
