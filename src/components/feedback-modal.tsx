'use client'

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { sendFeedback, type FeedbackState } from '@/lib/feedback'

interface FeedbackContextValue {
  open: () => void
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext)
  if (!ctx) {
    throw new Error('useFeedback must be used inside <FeedbackProvider>.')
  }
  return ctx
}

export function MissingCourseLink() {
  const { open } = useFeedback()
  return (
    <button
      type="button"
      onClick={open}
      className="self-start text-xs text-ink/70 underline decoration-dotted underline-offset-4 transition hover:text-midnight"
    >
      Don&rsquo;t see your course? Send feedback →
    </button>
  )
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <FeedbackContext.Provider value={{ open }}>
      {children}
      {isOpen && <FeedbackModal onClose={close} />}
    </FeedbackContext.Provider>
  )
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(
    sendFeedback,
    undefined,
  )
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onClose, 1600)
      return () => clearTimeout(t)
    }
  }, [state, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/40 px-3 pb-3 pt-12 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-midnight/15 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-midnight/10 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <h2
              id="feedback-title"
              className="font-serif text-lg leading-tight text-midnight"
            >
              Send feedback
            </h2>
            <p className="text-xs leading-snug text-ink/70">
              Missing electives, bugs, ideas — anything. I read every message.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-full px-2 py-1 text-base leading-none text-ink/60 transition hover:bg-jordy/15 hover:text-midnight"
          >
            ✕
          </button>
        </div>

        {state?.ok ? (
          <div className="flex flex-col items-center gap-1 px-4 py-7 text-center">
            <p className="font-serif text-xl text-midnight">Thanks 🙏</p>
            <p className="text-sm text-ink/70">
              Got it. I&rsquo;ll take a look.
            </p>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-3 px-4 py-3">
            <textarea
              ref={textareaRef}
              name="message"
              required
              minLength={1}
              maxLength={5000}
              rows={6}
              placeholder="Type whatever you want…"
              className="w-full resize-y rounded-xl border border-midnight/20 bg-white px-3 py-2.5 text-base text-midnight outline-none transition placeholder:text-ink/40 focus:border-midnight focus:ring-2 focus:ring-midnight/15"
            />
            {state?.ok === false && (
              <p className="rounded-xl border border-robroy-deep/50 bg-robroy/25 px-3 py-2 text-sm text-midnight">
                {state.error}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-midnight/25 bg-white px-4 py-2 text-sm text-midnight transition hover:bg-jordy/15"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-midnight px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#001d52] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
