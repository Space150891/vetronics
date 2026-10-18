/** Vectronics network "V" logo mark (from the supplied brand sheet). */
export function BrandMark({ className, tile }: { className?: string | undefined; tile?: boolean }) {
  if (tile) {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <rect width="100" height="100" rx="22" className="fill-primary" />
        <g className="fill-primary-foreground stroke-primary-foreground" strokeWidth="6" strokeLinecap="round">
          <line x1="27" y1="32" x2="50" y2="66" /><line x1="73" y1="32" x2="50" y2="66" />
          <circle cx="27" cy="32" r="8" stroke="none" /><circle cx="73" cy="32" r="8" stroke="none" /><circle cx="50" cy="68" r="9.5" stroke="none" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <g className="fill-primary stroke-primary" strokeWidth="7" strokeLinecap="round">
        <line x1="14" y1="14" x2="50" y2="64" /><line x1="86" y1="14" x2="50" y2="64" />
        <circle cx="14" cy="14" r="11.5" stroke="none" /><circle cx="86" cy="14" r="11.5" stroke="none" /><circle cx="50" cy="64" r="13.5" stroke="none" />
      </g>
    </svg>
  );
}
