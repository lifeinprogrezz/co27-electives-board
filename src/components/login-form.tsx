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

const inputBase =
  'w-full rounded-xl border border-midnight/20 bg-white px-3 py-2.5 text-base text-midnight outline-none transition focus:border-midnight focus:ring-2 focus:ring-midnight/15 placeholder:text-ink/40'

const primaryBtn =
  'inline-flex w-full items-center justify-center rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#001d52] disabled:cursor-not-allowed disabled:opacity-60'

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
      <label
        htmlFor="email"
        className="text-xs font-medium uppercase tracking-wider text-ink/70"
      >
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
        className={inputBase}
      />
      {sendState?.ok === false && (
        <p className="text-sm text-robroy-deep">{sendState.error}</p>
      )}
      <button type="submit" disabled={sending} className={primaryBtn}>
        {sending ? 'Sending…' : 'Email me a code'}
      </button>
      <p className="text-xs leading-relaxed text-ink/60">
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
      <div className="rounded-xl border border-midnight/20 bg-jordy/15 p-4 text-sm text-midnight">
        <p className="font-serif text-lg">Check your inbox.</p>
        <p className="mt-1 text-ink">
          We sent a 6-digit sign-in code to{' '}
          <span className="font-mono text-midnight">{email}</span>. The email
          contains only the code, no link to click. Paste it below.
        </p>

      </div>

      <form action={verifyAction} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <label
          htmlFor="token"
          className="text-xs font-medium uppercase tracking-wider text-ink/70"
        >
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
          className={`${inputBase} text-center font-mono text-2xl tracking-[0.4em]`}
        />
        {verifyState?.ok === false && (
          <p className="text-sm text-robroy-deep">{verifyState.error}</p>
        )}
        <button type="submit" disabled={verifying} className={primaryBtn}>
          {verifying ? 'Verifying…' : 'Sign in'}
        </button>
        <p className="text-center text-xs leading-relaxed text-ink/60">
          Code expires in an hour. Didn&apos;t arrive? Check spam, then{' '}
          <a
            href="/login"
            className="underline decoration-midnight/30 underline-offset-2 hover:text-midnight"
          >
            try again
          </a>
          .
        </p>
      </form>
    </div>
  )
}
