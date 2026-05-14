'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveProfile, type SaveProfileState } from '@/lib/profile'
import { TERM_LABELS, type Course, type Term } from '@/lib/types'

type CourseChoice = 'none' | 'drop' | 'add'

interface Props {
  initialName: string
  initialWhatsapp: string
  initialCohortSection: 1 | 2 | 3 | null
  initialDropIds: string[]
  initialAddIds: string[]
  courses: Course[]
}

const initialState: SaveProfileState = undefined

export function ProfileForm({
  initialName,
  initialWhatsapp,
  initialCohortSection,
  initialDropIds,
  initialAddIds,
  courses,
}: Props) {
  const [state, action, pending] = useActionState(saveProfile, initialState)

  const [selection, setSelection] = useState<Record<string, CourseChoice>>(() => {
    const m: Record<string, CourseChoice> = {}
    for (const id of initialDropIds) m[id] = 'drop'
    for (const id of initialAddIds) m[id] = 'add'
    return m
  })

  const grouped = useMemo(() => {
    const m: Record<Term, Course[]> = { summer: [], september: [], term4: [] }
    for (const c of courses) m[c.term].push(c)
    return m
  }, [courses])

  const dropIds = Object.entries(selection)
    .filter(([, v]) => v === 'drop')
    .map(([id]) => id)
  const addIds = Object.entries(selection)
    .filter(([, v]) => v === 'add')
    .map(([id]) => id)

  function setChoice(courseId: string, next: CourseChoice) {
    setSelection((prev) => {
      const copy = { ...prev }
      if (next === 'none') delete copy[courseId]
      else copy[courseId] = next
      return copy
    })
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <h2 className="text-sm font-medium text-zinc-900">About you</h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Name</span>
          <input
            name="name"
            defaultValue={initialName}
            required
            maxLength={80}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">
            WhatsApp number{' '}
            <span className="text-zinc-400">(optional, international format)</span>
          </span>
          <input
            name="whatsapp"
            defaultValue={initialWhatsapp}
            inputMode="tel"
            placeholder="+34 666 123 456"
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
          <span className="text-xs text-zinc-500">
            If you skip this, classmates can still reach you by email.
          </span>
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="text-zinc-700">Cohort section</legend>
          <div className="mt-1 flex gap-2">
            {[1, 2, 3].map((n) => (
              <label
                key={n}
                className="flex-1 cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-center has-[input:checked]:border-zinc-900 has-[input:checked]:bg-zinc-900 has-[input:checked]:text-white"
              >
                <input
                  type="radio"
                  name="cohort_section"
                  value={n}
                  defaultChecked={initialCohortSection === n}
                  className="sr-only"
                  required
                />
                Section {n}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-zinc-900">Your electives</h2>
          <p className="text-xs text-zinc-500">
            For each course you care about, tap <strong>Drop</strong> (you have it and want
            to give it up) or <strong>Add</strong> (you want to pick it up).
          </p>
        </div>

        <div className="text-xs text-zinc-600">
          <span className="font-medium">{dropIds.length}</span> to drop ·{' '}
          <span className="font-medium">{addIds.length}</span> to add
        </div>

        {(['summer', 'september', 'term4'] as Term[]).map((term) =>
          grouped[term].length === 0 ? null : (
            <div key={term} className="flex flex-col gap-2">
              <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {TERM_LABELS[term]}
              </h3>
              <ul className="flex flex-col divide-y divide-zinc-100">
                {grouped[term].map((c) => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    choice={selection[c.id] ?? 'none'}
                    onChange={(v) => setChoice(c.id, v)}
                  />
                ))}
              </ul>
            </div>
          ),
        )}
      </section>

      {dropIds.map((id) => (
        <input key={`d-${id}`} type="hidden" name="drop_ids" value={id} />
      ))}
      {addIds.map((id) => (
        <input key={`a-${id}`} type="hidden" name="add_ids" value={id} />
      ))}

      {state?.ok === false && (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save and view the board'}
      </button>
    </form>
  )
}

function CourseRow({
  course,
  choice,
  onChange,
}: {
  course: Course
  choice: CourseChoice
  onChange: (c: CourseChoice) => void
}) {
  return (
    <li className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium text-zinc-900">{course.name}</span>
        <span className="text-xs text-zinc-500">
          {course.class_code ? `${course.class_code} · ` : ''}
          {course.ects} ECTS · {course.schedule_text ?? '—'}
          {course.professor ? ` · ${course.professor}` : ''}
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Pill
          active={choice === 'drop'}
          activeClass="bg-red-600 text-white border-red-600"
          onClick={() => onChange(choice === 'drop' ? 'none' : 'drop')}
        >
          Drop
        </Pill>
        <Pill
          active={choice === 'add'}
          activeClass="bg-emerald-600 text-white border-emerald-600"
          onClick={() => onChange(choice === 'add' ? 'none' : 'add')}
        >
          Add
        </Pill>
      </div>
    </li>
  )
}

function Pill({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean
  activeClass: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active ? activeClass : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      {children}
    </button>
  )
}
