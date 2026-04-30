import { MemberNav } from '@/components/nav/MemberNav'
import { getAppSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-cream-paper">
      <MemberNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
