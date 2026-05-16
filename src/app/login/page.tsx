import { LoginForm } from '@/components/login-form'

type SearchParams = Promise<{ error?: string; next?: string }>

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { error } = await searchParams

  return (
    <div className="relative mx-auto flex max-w-md flex-col gap-7">
      <div
        aria-hidden
        className="pointer-events-none fixed -right-[20vw] -top-[20vw] -z-10 h-[80vw] w-[80vw] rounded-full bg-jordy opacity-30 blur-3xl sm:-right-[10vw] sm:-top-[15vw] sm:h-[60vw] sm:w-[60vw]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-[25vw] -left-[20vw] -z-10 h-[60vw] w-[60vw] rounded-full bg-robroy opacity-15 blur-3xl sm:h-[45vw] sm:w-[45vw]"
      />

      <div className="flex items-center">
        <span className="font-serif text-[20px] leading-none text-midnight">
          co27.electives
        </span>
      </div>

      <header className="flex flex-col gap-3 pt-6">
        <h1 className="font-serif text-[44px] leading-[0.95] tracking-[-0.02em] text-midnight sm:text-[56px]">
          sign <span className="text-robroy-deep">in</span>.
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-ink">
          Trade Co27 electives with your cohort. Post the courses you want to
          drop, see who wants them, and forget about the eOffice refresh game.
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
