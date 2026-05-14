export type Term = 'summer' | 'september' | 'term4'
export type Slot = 'AM' | 'PM' | 'AM+PM' | 'online' | 'fri-pm' | 'special'
export type ListingType = 'have_want_drop' | 'want_add'
export type ListingStatus = 'active' | 'closed'

export interface Course {
  id: string
  class_code: string | null
  name: string
  ects: number
  professor: string | null
  term: Term
  schedule_text: string | null
  slot: Slot | null
  notes: string | null
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  whatsapp_number: string | null
  cohort_section: 1 | 2 | 3 | null
}

export interface Listing {
  id: string
  user_id: string
  course_id: string
  type: ListingType
  status: ListingStatus
  created_at: string
}

export const TERM_LABELS: Record<Term, string> = {
  summer: 'Summer (Jun–Jul)',
  september: 'September Intensive',
  term4: 'Term 4 (Oct–Dec)',
}
