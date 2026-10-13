import { useId } from 'react'

// Decorative shapes. They are drawn in SVG and blurred with CSS so the page needs no image assets.

/** Blue block seen from a corner: three faces in three shades. */
export function Prism({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <polygon points="100,8 180,54 100,100 20,54" fill="#6f9aff" />
      <polygon points="20,54 100,100 100,192 20,146" fill="#4763f3" />
      <polygon points="180,54 180,146 100,192 100,100" fill="#2c40c6" />
    </svg>
  )
}

/** Violet spring made of stacked, tilted loops. */
export function Coil({ className }: { className?: string }) {
  const gradient = useId()
  return (
    <svg viewBox="0 0 240 330" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3bcff" />
          <stop offset="0.45" stopColor="#9a6bff" />
          <stop offset="1" stopColor="#5532e6" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((loop) => (
        <ellipse
          key={loop}
          cx="120"
          cy={66 + loop * 62}
          rx="92"
          ry="36"
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth="34"
          transform={`rotate(-16 120 ${66 + loop * 62})`}
        />
      ))}
    </svg>
  )
}

/** Soft violet ring that sits behind a centered heading. */
export function Ring({ className }: { className?: string }) {
  const gradient = useId()
  return (
    <svg viewBox="0 0 640 420" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d79bff" />
          <stop offset="0.5" stopColor="#5a38e0" />
          <stop offset="1" stopColor="#c98bf5" />
        </linearGradient>
      </defs>
      <ellipse
        cx="320"
        cy="210"
        rx="240"
        ry="118"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="74"
        transform="rotate(-14 320 210)"
      />
    </svg>
  )
}

/** Glossy sphere used as an agent's avatar. The hue stays between blue and pink. */
export function Orb({ seed, className }: { seed: number; className?: string }) {
  const hue = 225 + ((seed * 37) % 95)
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        borderRadius: '9999px',
        background: [
          'radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.85) 0%, transparent 26%)',
          `radial-gradient(circle at 36% 32%, hsl(${hue} 95% 76%) 0%, hsl(${hue} 82% 52%) 48%, hsl(${hue} 80% 22%) 100%)`,
        ].join(', '),
        boxShadow: `0 6px 22px -6px hsl(${hue} 90% 55% / 0.7)`,
      }}
    />
  )
}
