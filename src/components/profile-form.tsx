'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { saveProfile, type SaveProfileState } from '@/lib/profile'
import { TERM_LABELS, type Course, type Term } from '@/lib/types'

const DRAFT_KEY = 'co27-profile-draft-v1'

interface Draft {
  name: string
  whatsapp: string
  assigned: string[]
  drops: string[]
  adds: string[]
  step: number
}

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

const fieldClass =
  'w-full rounded-xl border border-midnight/20 bg-white px-3 py-2.5 text-base text-midnight outline-none transition focus:border-midnight focus:ring-2 focus:ring-midnight/15 placeholder:text-ink/40'

const sectionCard =
  'flex flex-col gap-4 rounded-xl border border-midnight/15 bg-white p-4'

// Back and Continue share the same shape, size and family — only the fill changes.
const buttonBase =
  'rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40'
const primaryBtn = `${buttonBase} bg-midnight text-white shadow-sm hover:bg-[#001d52]`
const secondaryBtn = `${buttonBase} border border-midnight/25 bg-white text-midnight hover:bg-jordy/15`

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

  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    if (isReturning) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Draft
      /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration must happen after mount. */
      if (typeof draft.name === 'string' && draft.name) setName(draft.name)
      if (typeof draft.whatsapp === 'string') setWhatsapp(draft.whatsapp)
      if (Array.isArray(draft.assigned)) setAssigned(new Set(draft.assigned))
      if (Array.isArray(draft.drops)) setDrops(new Set(draft.drops))
      if (Array.isArray(draft.adds)) setAdds(new Set(draft.adds))
      if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= 4)
        setStep(draft.step as Step)
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // ignore malformed drafts
    }
  }, [isReturning])

  useEffect(() => {
    if (!restoredRef.current) return
    try {
      const draft: Draft = {
        name,
        whatsapp,
        assigned: [...assigned],
        drops: [...drops],
        adds: [...adds],
        step,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore quota / private-mode errors
    }
  }, [name, whatsapp, assigned, drops, adds, step])

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // noop
    }
  }

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

  const step1Valid = name.trim().length >= 1 && name.trim().length <= 80
  const whatsappDigits = normalizeWhatsappPreview(whatsapp)
  const whatsappWarning =
    whatsapp.trim() &&
    (whatsappDigits.length < 6 || whatsappDigits.length > 15)
      ? 'WhatsApp number should be 6 to 15 digits (international format).'
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

  const formRef = useRef<HTMLFormElement | null>(null)

  function onSaveClick() {
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    clearDraft()
    startTransition(() => action(formData))
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-[34px] leading-[0.95] tracking-[-0.02em] text-midnight sm:text-[42px]">
          {isReturning ? 'edit your profile.' : 'welcome. let’s set you up.'}
        </h1>
        <Stepper current={step} onSelect={(s) => isReturning && setStep(s)} canJump={isReturning} />
      </header>

      <form
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-5"
      >
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
          <p className="rounded-xl border border-robroy-deep/50 bg-robroy/25 px-3 py-2 text-sm text-midnight">
            {state.error}
          </p>
        )}

        <StepFooter
          step={step}
          setStep={setStep}
          canContinue={canContinue[step]}
          pending={pending}
          onSave={onSaveClick}
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
          ? 'border-midnight bg-midnight text-white'
          : isDone
            ? 'border-jordy/50 bg-jordy/20 text-midnight'
            : 'border-midnight/15 bg-white text-ink/60'
        const content = (
          <span className={`${baseClasses} ${stateClasses}`}>
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                isActive
                  ? 'bg-white text-midnight'
                  : isDone
                    ? 'bg-midnight text-white'
                    : 'bg-jordy/20 text-midnight'
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
  onSave,
}: {
  step: Step
  setStep: (s: Step) => void
  canContinue: boolean
  pending: boolean
  onSave: () => void
}) {
  const isLast = step === 4
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 flex items-center justify-between gap-3 border-t border-midnight/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <button
        type="button"
        onClick={() => setStep(Math.max(1, step - 1) as Step)}
        disabled={step === 1}
        className={secondaryBtn}
      >
        ← Back
      </button>
      {isLast ? (
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className={primaryBtn}
        >
          {pending ? 'Saving…' : 'Save and view the board'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStep(Math.min(4, step + 1) as Step)}
          disabled={!canContinue}
          className={primaryBtn}
        >
          Continue →
        </button>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: React.ReactNode
  subtitle: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="font-serif text-xl text-midnight sm:text-2xl">{title}</h2>
      <p className="text-sm leading-relaxed text-ink/70">{subtitle}</p>
    </div>
  )
}

function CountBadge({
  count,
  label,
  tone,
}: {
  count: number
  label: string
  tone: 'neutral' | 'drop' | 'add'
}) {
  const cls =
    tone === 'drop'
      ? 'bg-robroy/30 text-midnight border-robroy-deep/40'
      : tone === 'add'
        ? 'bg-midnight text-white border-midnight'
        : 'bg-jordy/25 text-midnight border-jordy/50'
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
    >
      <span className="text-sm font-semibold leading-none">{count}</span>
      <span className="text-[11px] uppercase tracking-wider">{label}</span>
    </span>
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
    <section className={sectionCard}>
      <SectionHeader
        title="About you"
        subtitle="How classmates will see and reach you on the board."
      />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium uppercase tracking-wider text-ink/70">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          autoFocus
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium uppercase tracking-wider text-ink/70">
          WhatsApp number <span className="text-ink/40">(optional)</span>
        </span>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          placeholder="+34 666 123 456"
          className={fieldClass}
        />
        <span className="text-xs text-ink/60">
          If you skip this, classmates can reach you by email.
        </span>
        {warning && (
          <span className="text-xs text-robroy-deep">{warning}</span>
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
    <section className={sectionCard}>
      <SectionHeader
        title="Your assigned electives"
        subtitle="Pick the courses you were allocated in the initial bid."
      />

      <CountBadge count={count} label="selected" tone="neutral" />

      {(['summer', 'september', 'term4'] as Term[]).map((term) =>
        grouped[term].length === 0 ? null : (
          <div key={term} className="flex flex-col gap-2">
            <h3 className="mt-2 text-[11px] font-medium uppercase tracking-wider text-ink/60">
              {TERM_LABELS[term]}
            </h3>
            <ul className="flex flex-col divide-y divide-midnight/10">
              {grouped[term].map((c) => (
                <PillRow
                  key={c.id}
                  course={c}
                  active={assigned.has(c.id)}
                  activeLabel="Assigned"
                  inactiveLabel="Assign"
                  activeClass="border-midnight bg-midnight text-white"
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
    <section className={sectionCard}>
      <SectionHeader
        title="Which of those do you want to drop?"
        subtitle="Mark the ones you'd give up. Skip if you're not dropping anything."
      />

      {assignedCourses.length === 0 ? (
        <p className="rounded-xl border border-midnight/15 bg-jordy/10 px-3 py-3 text-sm text-ink/70">
          You haven&apos;t marked any assigned electives yet (step 2). Go back to
          pick them first.
        </p>
      ) : (
        <>
          <CountBadge count={count} label="to drop" tone="drop" />
          <ul className="flex flex-col divide-y divide-midnight/10">
            {assignedCourses.map((c) => (
              <PillRow
                key={c.id}
                course={c}
                active={drops.has(c.id)}
                activeLabel="Dropping"
                inactiveLabel="Keep"
                activeClass="border-robroy-deep bg-robroy text-midnight"
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
    <section className={sectionCard}>
      <SectionHeader
        title="Which courses would you like to add?"
        subtitle="Courses you weren't assigned. Optional."
      />

      <CountBadge count={count} label="to add" tone="add" />

      {(['summer', 'september', 'term4'] as Term[]).map((term) =>
        unassignedByTerm[term].length === 0 ? null : (
          <div key={term} className="flex flex-col gap-2">
            <h3 className="mt-2 text-[11px] font-medium uppercase tracking-wider text-ink/60">
              {TERM_LABELS[term]}
            </h3>
            <ul className="flex flex-col divide-y divide-midnight/10">
              {unassignedByTerm[term].map((c) => (
                <PillRow
                  key={c.id}
                  course={c}
                  active={adds.has(c.id)}
                  activeLabel="Adding"
                  inactiveLabel="Add"
                  activeClass="border-midnight bg-midnight text-white"
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
        <span className="font-medium text-midnight">{course.name}</span>
        <span className="text-xs text-ink/60">
          {course.class_code ? `${course.class_code} · ` : ''}
          {course.ects} ECTS · {course.schedule_text ?? ''}
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
            : 'border-midnight/20 bg-white text-midnight hover:bg-jordy/15'
        }`}
      >
        {active ? activeLabel : inactiveLabel}
      </button>
    </li>
  )
}
