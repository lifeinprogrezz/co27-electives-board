import { LoginForm } from '@/components/login-form'

type SearchParams = Promise<{ error?: string; next?: string }>

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  return (
    <div className="relative isolate mx-auto flex max-w-md flex-col gap-7 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-jordy opacity-35 blur-3xl sm:-right-16 sm:h-96 sm:w-96"
      />

      <div className="flex items-center">
        <span className="font-serif text-[20px] leading-none text-midnight">
          co27.electives
        </span>
      </div>

      <header className="flex flex-col gap-3 pt-6">
        <h1 className="font-serif text-[44px] leading-[0.95] tracking-[-0.02em] text-midnight sm:text-[56px]">
          sign in.
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-ink">
          Trade Co27 electives with your cohort. Post the courses you want to
          drop, see who wants them, and settle the swap on WhatsApp.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-robroy-deep/60 bg-robroy/25 px-3 py-2 text-sm text-midnight">
          Couldn&rsquo;t sign you in: {decodeURIComponent(error)}
        </div>
      )}

      <LoginForm />
    </div>
  )
}
