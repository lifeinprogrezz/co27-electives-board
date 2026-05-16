type Variant = 'drop' | 'want'

interface Props {
  variant: Variant
  label: string
  title: string
}

const container: Record<Variant, string> = {
  drop: 'bg-robroy border border-midnight text-midnight -rotate-3',
  want: 'bg-midnight text-white rotate-[2.5deg]',
}

const labelColor: Record<Variant, string> = {
  drop: 'text-midnight/80',
  want: 'text-[#A8C0E0]',
}

export function TiltCard({ variant, label, title }: Props) {
  return (
    <div
      className={`rounded-xl p-3 shadow-sm transition-transform duration-300 hover:rotate-0 ${container[variant]}`}
    >
      <p
        className={`text-[10px] font-medium uppercase tracking-wider ${labelColor[variant]}`}
      >
        {label}
      </p>
      <p className="mt-1 font-serif text-xl italic leading-tight">{title}</p>
    </div>
  )
}
