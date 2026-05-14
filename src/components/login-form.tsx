'use client'

import { useActionState } from 'react'
import {
  signInWithMagicLink,
  verifyEmailOtp,
  type SignInState,
  type VerifyOtpState,
} from '@/lib/auth'

const initialSend: SignInState = undefined
const initialVerify: VerifyOtpState = undefined

export function LoginForm() {
  const [sendState, sendAction, sending] = useActionState(
    signInWithMagicLink,
    initialSend,
  )

  if (sendState?.ok) {
    return <OtpStep email={sendState.email} />
  }

  return (
    <form action={sendAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-zinc-700">
        ESADE email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="name@alumni.esade.edu"
        defaultValue={sendState?.ok === false ? sendState.lastEmail ?? '' : ''}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
      {sendState?.ok === false && (
        <p className="text-sm text-red-600">{sendState.error}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? 'Sending…' : 'Email me a magic link'}
      </button>
      <p className="text-xs text-zinc-500">
        Only ESADE emails (<span className="font-mono">@alumni.esade.edu</span> or{' '}
        <span className="font-mono">@esade.edu</span>) can sign in.
      </p>
    </form>
  )
}

function OtpStep({ email }: { email: string }) {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailOtp,
    initialVerify,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-medium">Check your inbox.</p>
        <p className="mt-1">
          We sent a sign-in code to <span className="font-mono">{email}</span>. Open it on
          any device.
        </p>
      </div>

      <form action={verifyAction} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <label htmlFor="token" className="text-sm font-medium text-zinc-700">
          6-digit code from the email
        </label>
        <input
          id="token"
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="123456"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
        {verifyState?.ok === false && (
          <p className="text-sm text-red-600">{verifyState.error}</p>
        )}
        <button
          type="submit"
          disabled={verifying}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying ? 'Verifying…' : 'Sign in'}
        </button>
        <p className="text-xs text-zinc-500">
          You can also click the magic link in the email — but pasting the code is
          recommended (some email systems pre-fetch links and invalidate them).
        </p>
      </form>
    </div>
  )
}
