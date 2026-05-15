'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveProfile, type SaveProfileState } from '@/lib/profile'
import { TERM_LABELS, type Course, type Term } from '@/lib/types'

interface Props {
  initialName: string
  initialWhatsapp: string
  initialAssignedIds: string[]
  initialDropIds: string[]
  initialAddIds: string[]
  courses: Course[]
}

const initialState: SaveProfileState = undefined

export function ProfileForm({
  initialName,
  initialWhatsapp,
  initialAssignedIds,
  initialDropIds,
  initialAddIds,
  courses,
}: Props) {
  const [state, action, pending] = useActionState(saveProfile, initialState)

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

  function toggleAssigned(id: string) {
    setAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // If we just un-assigned a course, also clear any drop for it.
        setDrops((d) => {
          if (!d.has(id)) return d
          const nd = new Set(d)
          nd.delete(id)
          return nd
        })
      } else {
        next.add(id)
        // If we just assigned a course, clear any "add" for it (you can't add what you have).
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

  const assignedCourses = useMemo(
    () => courses.filter((c) => assigned.has(c.id)),
    [courses, assigned],
  )
  const unassignedByTerm = useMemo(() => {
    const m: Record<Term, Course[]> = { summer: [], september: [], term4: [] }
    for (const c of courses) if (!assigned.has(c.id)) m[c.term].push(c)
    return m
  }, [courses, assigned])

  const assignedIdsArr = [...assigned]
  const dropIdsArr = [...drops]
  const addIdsArr = [...adds]

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* About you */}
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
      </section>

      {/* Step 1: Assigned electives */}
      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-zinc-900">
            1. Your assigned electives
          </h2>
          <p className="text-xs text-zinc-500">
            Pick the courses you were allocated in the initial bid.
          </p>
        </div>

        <div className="text-xs text-zinc-600">
          <span className="font-medium">{assignedIdsArr.length}</span> selected
        </div>

        {(['summer', 'september', 'term4'] as Term[]).map((term) =>
          grouped[term].length === 0 ? null : (
            <div key={term} className="flex flex-col gap-2">
              <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {TERM_LABELS[term]}
              </h3>
              <ul className="flex flex-col divide-y divide-zinc-100">
                {grouped[term].map((c) => (
                  <AssignRow
                    key={c.id}
                    course={c}
                    selected={assigned.has(c.id)}
                    onToggle={() => toggleAssigned(c.id)}
                  />
                ))}
              </ul>
            </div>
          ),
        )}
      </section>

      {/* Step 2: Drops (only over assigned) */}
      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-zinc-900">
            2. Which of those do you want to <span className="text-red-700">drop</span>?
          </h2>
          <p className="text-xs text-zinc-500">
            Mark the ones you&apos;re willing to give up. Classmates can then reach
            out.
          </p>
        </div>

        {assignedCourses.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
            Pick your assigned electives above first.
          </p>
        ) : (
          <>
            <div className="text-xs text-zinc-600">
              <span className="font-medium">{dropIdsArr.length}</span> to drop
            </div>
            <ul className="flex flex-col divide-y divide-zinc-100">
              {assignedCourses.map((c) => (
                <DropRow
                  key={c.id}
                  course={c}
                  selected={drops.has(c.id)}
                  onToggle={() => toggleDrop(c.id)}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Step 3: Adds (only over unassigned) */}
      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-zinc-900">
            3. Which courses would you like to{' '}
            <span className="text-emerald-700">add</span>?
          </h2>
          <p className="text-xs text-zinc-500">
            From courses you weren&apos;t assigned. You don&apos;t need to pick any.
          </p>
        </div>

        <div className="text-xs text-zinc-600">
          <span className="font-medium">{addIdsArr.length}</span> to add
        </div>

        {(['summer', 'september', 'term4'] as Term[]).map((term) =>
          unassignedByTerm[term].length === 0 ? null : (
            <div key={term} className="flex flex-col gap-2">
              <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {TERM_LABELS[term]}
              </h3>
              <ul className="flex flex-col divide-y divide-zinc-100">
                {unassignedByTerm[term].map((c) => (
                  <AddRow
                    key={c.id}
                    course={c}
                    selected={adds.has(c.id)}
                    onToggle={() => toggleAdd(c.id)}
                  />
                ))}
              </ul>
            </div>
          ),
        )}
      </section>

      {assignedIdsArr.map((id) => (
        <input key={`as-${id}`} type="hidden" name="assigned_ids" value={id} />
      ))}
      {dropIdsArr.map((id) => (
        <input key={`d-${id}`} type="hidden" name="drop_ids" value={id} />
      ))}
      {addIdsArr.map((id) => (
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

function CourseMeta({ course }: { course: Course }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="font-medium text-zinc-900">{course.name}</span>
      <span className="text-xs text-zinc-500">
        {course.class_code ? `${course.class_code} · ` : ''}
        {course.ects} ECTS · {course.schedule_text ?? '—'}
        {course.professor ? ` · ${course.professor}` : ''}
      </span>
    </div>
  )
}

function AssignRow({
  course,
  selected,
  onToggle,
}: {
  course: Course
  selected: boolean
  onToggle: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <CourseMeta course={course} />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
          selected
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
        }`}
      >
        {selected ? 'Assigned' : 'Assign'}
      </button>
    </li>
  )
}

function DropRow({
  course,
  selected,
  onToggle,
}: {
  course: Course
  selected: boolean
  onToggle: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <CourseMeta course={course} />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
          selected
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
        }`}
      >
        {selected ? 'Dropping' : 'Keep'}
      </button>
    </li>
  )
}

function AddRow({
  course,
  selected,
  onToggle,
}: {
  course: Course
  selected: boolean
  onToggle: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <CourseMeta course={course} />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
          selected
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
        }`}
      >
        {selected ? 'Adding' : 'Add'}
      </button>
    </li>
  )
}
