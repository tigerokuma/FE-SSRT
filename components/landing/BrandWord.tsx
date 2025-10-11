// components/landing/BrandWord.tsx
type Props = {
  children?: string
  className?: string
  // which SVG gradient to mimic
  variant?: 'shield' | 'strokeRight' | 'hotCenter' | 'strokeLeft'
  // optional subtle shimmer
  animated?: boolean
}

export default function BrandWord({
  children = 'Deply',
  className = '',
  variant = 'shield',
  animated = false,
}: Props) {
  // Tailwind gradient directions + stops mapped to your SVG
  // @ts-ignore
    const palette: Record<Props['variant'], string> = {
    // paint0: vertical #DDDDDD → #9386EA → #2200FF
    shield:
      'bg-gradient-to-b from-[#DDDDDD] via-[#9386EA] to-[#2200FF]',
    // paint1: diagonal #2706FF → #00FF66
    strokeRight:
      'bg-gradient-to-tr from-[#2706FF] to-[#00FF66]',
    // paint2: vertical #FF6466 → #2706FF
    hotCenter:
      'bg-gradient-to-b from-[#FF6466] to-[#2706FF]',
    // paint3: diagonal #2706FF → #FFFF00
    strokeLeft:
      'bg-gradient-to-tl from-[#2706FF] to-[#FFFF00]',
  }

  const animation = animated
    ? 'bg-[length:200%_200%] animate-[gradient-x_8s_ease_infinite]'
    : ''

  return (
    <span
      className={[
        'inline-block',
        'bg-clip-text text-transparent webkit-text-fill-transparent',
        palette[variant] ?? palette.shield,
        animation,
        'font-semibold tracking-tight',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
