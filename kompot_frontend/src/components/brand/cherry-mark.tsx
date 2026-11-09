export const CherryMark = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M30 30c6-14 16-18 24-18" fill="none" stroke="#3f8f4a" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 14c2 4 1 8-1 11" fill="none" stroke="#3f8f4a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="42" r="13" fill="#c4234a" />
      <circle cx="42" cy="46" r="11" fill="#a31634" />
      <ellipse cx="19" cy="37" rx="4" ry="2.4" fill="#ffd6dc" opacity="0.85" />
      <ellipse cx="38" cy="42" rx="3" ry="1.8" fill="#ffd6dc" opacity="0.7" />
    </svg>
  )
}
