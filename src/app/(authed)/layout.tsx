import { AppHeader } from '@/components/app-header'
import { getCurrentProfile, requireUser } from '@/lib/dal'

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const profile = await getCurrentProfile()

  return (
    <div className="flex flex-col gap-5">
      <AppHeader
        name={profile?.name ?? null}
        email={profile?.email ?? user.email ?? ''}
      />
      {children}
    </div>
  )
}
