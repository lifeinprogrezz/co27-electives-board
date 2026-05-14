'use client'

import { useActionState } from 'react'
import { signInWithMagicLink, type SignInState } from '@/lib/auth'

const initial: SignInState = undefined

export function LoginForm() {
  const [state, action, pending] = useActionState(signInWithMagicLink, initial)

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-medium">Check your inbox.</p>
        <p className="mt-1">
          We sent a magic link to <span className="font-mono">{state.email}</span>. Open it on
          this device to finish signing in.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-zinc-700">
        ESADE email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="name@esade.edu"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
      {state?.ok === false && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Email me a magic link'}
      </button>
      <p className="text-xs text-zinc-500">
        Only <span className="font-mono">@esade.edu</span> emails can sign in.
      </p>
    </form>
  )
}
