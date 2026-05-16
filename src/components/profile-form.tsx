'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveProfile, type SaveProfileState } from '@/lib/profile'
import { TERM_LABELS, type Course, type Term } from '@/lib/types'

type Step = 1 | 2 | 3 | 4
const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 1, label: 'About you', short: 'You' },
  { id: 2, label: 'Assigned', short: 'Assigned' },
  { id: 3, label: 'To drop', short: 'Drop' },
  { id: 4, label: 'To add', short: 'Add' },
]

interface Props {
  isReturning: boolean
  initialName: string
  initialWhatsapp: string
  initialAssignedIds: string[]
  initialDropIds: string[]
  initialAddIds: string[]
  courses: Course[]
}

const initialState: SaveProfileState = undefined

function normalizeWhatsappPreview(input: string): string {
  const digits = input.replace(/\D+/g, '')
  return digits
}

export function ProfileForm({
  isReturning,
  initialName,
  initialWhatsapp,
  initialAssignedIds,
  initialDropIds,
  initialAddIds,
  courses,
}: Props) {
  const [state, action, pending] = useActionState(saveProfile, initialState)
  const [step, setStep] = useState<Step>(1)

  const [name, setName] = useState(initialName)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)

  const [assigned, setAssigned] = useState<Set<string>>(
    () => new Set(initialAssignedIds),
  )
  const [drops, setDrops] = useState<Set<string>>(() => new Set(initialDropIds))
  const [adds, setAdds] = useState<Set<string>>(() => new Set(initialAddIds))

  const grouped = useMemo(() => {
    const m: Record<Term, Course[]> = { summer: [], september: [], term4: [] }
    for (const c of courses) m[c.term].push(c)
    return m
  }, [courses])

  const assignedCourses = useMemo(
    () => courses.filter((c) => assigned.has(c.id)),
    [courses, assigned],
  )
  const unassignedByTerm = useMemo(() => {
    const m: Record<Term, Course[]> = { summer: [], september: [], term4: [] }
    for (const c of courses) if (!assigned.has(c.id)) m[c.term].push(c)
    return m
  }, [courses, assigned])

  function toggleAssigned(id: string) {
    setAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setDrops((d) => {
          if (!d.has(id)) return d
          const nd = new Set(d)
          nd.delete(id)
          return nd
        })
      } else {
        next.add(id)
        setAdds((a) => {
          if (!a.has(id)) return a
          const na = new Set(a)
          na.delete(id)
          return na
        })
      }
      return next
    })
  }

  function toggleDrop(id: string) {
    setDrops((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAdd(id: string) {
    setAdds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Step 1 validation: name required (whatsapp optional, but if present must look sane).
  const step1Valid = name.trim().length >= 1 && name.trim().length <= 80
  const whatsappDigits = normalizeWhatsappPreview(whatsapp)
  const whatsappWarning =
    whatsapp.trim() &&
    (whatsappDigits.length < 6 || whatsappDigits.length > 15)
      ? 'WhatsApp number should be 6–15 digits (international format).'
      : null

  const canContinue: Record<Step, boolean> = {
    1: step1Valid && !whatsappWarning,
    2: true,
    3: true,
    4: true,
  }

  const assignedIdsArr = [...assigned]
  const dropIdsArr = [...drops]
  const addIdsArr = [...adds]

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {isReturning ? 'Edit your profile' : 'Welcome — let’s set you up'}
        </h1>
        <Stepper current={step} onSelect={(s) => isReturning && setStep(s)} canJump={isReturning} />
      </header>

      <form action={action} className="flex flex-col gap-5">
        {/* Hidden fields keep ALL state in the form on submit. */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="whatsapp" value={whatsapp} />
        {assignedIdsArr.map((id) => (
          <input key={`as-${id}`} type="hidden" name="assigned_ids" value={id} />
        ))}
        {dropIdsArr.map((id) => (
          <input key={`d-${id}`} type="hidden" name="drop_ids" value={id} />
        ))}
        {addIdsArr.map((id) => (
          <input key={`a-${id}`} type="hidden" name="add_ids" value={id} />
        ))}

        {step === 1 && (
          <Step1
            name={name}
            setName={setName}
            whatsapp={whatsapp}
            setWhatsapp={setWhatsapp}
            warning={whatsappWarning}
          />
        )}
        {step === 2 && (
          <Step2
            grouped={grouped}
            assigned={assigned}
            toggle={toggleAssigned}
            count={assignedIdsArr.length}
          />
        )}
        {step === 3 && (
          <Step3
            assignedCourses={assignedCourses}
            drops={drops}
            toggle={toggleDrop}
            count={dropIdsArr.length}
          />
        )}
        {step === 4 && (
          <Step4
            unassignedByTerm={unassignedByTerm}
            adds={adds}
            toggle={toggleAdd}
            count={addIdsArr.length}
          />
        )}

        {state?.ok === false && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <StepFooter
          step={step}
          setStep={setStep}
          canContinue={canContinue[step]}
          pending={pending}
        />
      </form>
    </div>
  )
}

function Stepper({
  current,
  onSelect,
  canJump,
}: {
  current: Step
  onSelect: (s: Step) => void
  canJump: boolean
}) {
  return (
    <ol className="flex items-center gap-1.5 text-[11px] sm:text-xs">
      {STEPS.map((s) => {
        const isActive = s.id === current
        const isDone = s.id < current
        const baseClasses =
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition'
        const stateClasses = isActive
          ? 'border-zinc-900 bg-zinc-900 text-white'
          : isDone
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-zinc-200 bg-white text-zinc-500'
        const content = (
          <span className={`${baseClasses} ${stateClasses}`}>
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                isActive
                  ? 'bg-white text-zinc-900'
                  : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              {isDone ? '✓' : s.id}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.short}</span>
          </span>
        )
        return (
          <li key={s.id}>
            {canJump ? (
              <button type="button" onClick={() => onSelect(s.id)}>
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepFooter({
  step,
  setStep,
  canContinue,
  pending,
}: {
  step: Step
  setStep: (s: Step) => void
  canContinue: boolean
  pending: boolean
}) {
  const isLast = step === 4
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => setStep(Math.max(1, step - 1) as Step)}
        disabled={step === 1}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Back
      </button>
      {isLast ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save and view the board'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStep(Math.min(4, step + 1) as Step)}
          disabled={!canContinue}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue →
        </button>
      )}
    </div>
  )
}

function Step1({
  name,
  setName,
  whatsapp,
  setWhatsapp,
  warning,
}: {
  name: string
  setName: (s: string) => void
  whatsapp: string
  setWhatsapp: (s: string) => void
  warning: string | null
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900">About you</h2>
        <p className="text-xs text-zinc-500">
          How classmates will see and reach you on the board.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          autoFocus
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700">
          WhatsApp number{' '}
          <span className="text-zinc-400">(optional)</span>
        </span>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          placeholder="+34 666 123 456"
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
        <span className="text-xs text-zinc-500">
          If you skip this, classmates can reach you by email.
        </span>
        {warning && (
          <span className="text-xs text-amber-700">{warning}</span>
        )}
      </label>
    </section>
  )
}

function Step2({
  grouped,
  assigned,
  toggle,
  count,
}: {
  grouped: Record<Term, Course[]>
  assigned: Set<string>
  toggle: (id: string) => void
  count: number
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900">Your assigned electives</h2>
        <p className="text-xs text-zinc-500">
          Pick the courses you were allocated in the initial bid.
        </p>
      </div>

      <div className="text-xs text-zinc-600">
        <span className="font-medium">{count}</span> selected
      </div>

      {(['summer', 'september', 'term4'] as Term[]).map((term) =>
        grouped[term].length === 0 ? null : (
          <div key={term} className="flex flex-col gap-2">
            <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {TERM_LABELS[term]}
            </h3>
            <ul className="flex flex-col divide-y divide-zinc-100">
              {grouped[term].map((c) => (
                <PillRow
                  key={c.id}
                  course={c}
                  active={assigned.has(c.id)}
                  activeLabel="Assigned"
                  inactiveLabel="Assign"
                  activeClass="border-zinc-900 bg-zinc-900 text-white"
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </ul>
          </div>
        ),
      )}
    </section>
  )
}

function Step3({
  assignedCourses,
  drops,
  toggle,
  count,
}: {
  assignedCourses: Course[]
  drops: Set<string>
  toggle: (id: string) => void
  count: number
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900">
          Which of those do you want to <span className="text-red-700">drop</span>?
        </h2>
        <p className="text-xs text-zinc-500">
          Mark the ones you&apos;d give up. Classmates can reach out to swap.
          Skip this step if you&apos;re not dropping anything.
        </p>
      </div>

      {assignedCourses.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          You haven&apos;t marked any assigned electives yet (step 2). Go back to
          pick them first.
        </p>
      ) : (
        <>
          <div className="text-xs text-zinc-600">
            <span className="font-medium">{count}</span> to drop
          </div>
          <ul className="flex flex-col divide-y divide-zinc-100">
            {assignedCourses.map((c) => (
              <PillRow
                key={c.id}
                course={c}
                active={drops.has(c.id)}
                activeLabel="Dropping"
                inactiveLabel="Keep"
                activeClass="border-red-600 bg-red-600 text-white"
                onToggle={() => toggle(c.id)}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function Step4({
  unassignedByTerm,
  adds,
  toggle,
  count,
}: {
  unassignedByTerm: Record<Term, Course[]>
  adds: Set<string>
  toggle: (id: string) => void
  count: number
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900">
          Which courses would you like to{' '}
          <span className="text-emerald-700">add</span>?
        </h2>
        <p className="text-xs text-zinc-500">
          From courses you weren&apos;t assigned. Optional — you don&apos;t need to
          pick any.
        </p>
      </div>

      <div className="text-xs text-zinc-600">
        <span className="font-medium">{count}</span> to add
      </div>

      {(['summer', 'september', 'term4'] as Term[]).map((term) =>
        unassignedByTerm[term].length === 0 ? null : (
          <div key={term} className="flex flex-col gap-2">
            <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {TERM_LABELS[term]}
            </h3>
            <ul className="flex flex-col divide-y divide-zinc-100">
              {unassignedByTerm[term].map((c) => (
                <PillRow
                  key={c.id}
                  course={c}
                  active={adds.has(c.id)}
                  activeLabel="Adding"
                  inactiveLabel="Add"
                  activeClass="border-emerald-600 bg-emerald-600 text-white"
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </ul>
          </div>
        ),
      )}
    </section>
  )
}

function PillRow({
  course,
  active,
  activeLabel,
  inactiveLabel,
  activeClass,
  onToggle,
}: {
  course: Course
  active: boolean
  activeLabel: string
  inactiveLabel: string
  activeClass: string
  onToggle: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium text-zinc-900">{course.name}</span>
        <span className="text-xs text-zinc-500">
          {course.class_code ? `${course.class_code} · ` : ''}
          {course.ects} ECTS · {course.schedule_text ?? '—'}
          {course.professor ? ` · ${course.professor}` : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
          active
            ? activeClass
            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
        }`}
      >
        {active ? activeLabel : inactiveLabel}
      </button>
    </li>
  )
}
