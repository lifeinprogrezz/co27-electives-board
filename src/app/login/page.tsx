import Link from 'next/link'
import { LoginForm } from '@/components/login-form'

type SearchParams = Promise<{ error?: string; next?: string }>

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
          ← Home
        </Link>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Sign in</h1>
        <p className="text-sm text-zinc-600">
          We&apos;ll email you a one-time link. No password.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn&apos;t sign you in: {decodeURIComponent(error)}
        </div>
      )}

      <LoginForm />
    </div>
  )
}
