import type { SignKind } from '@/lib/signs'

const K = '#1a1a1a'

/** Señal dibujada con su forma y color normados. Se usa cuando un producto aún no tiene foto. */
export function SignTile({ kind, className = '' }: { kind: SignKind; className?: string }) {
  return (
    <div className={`sign-tile ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {kind === 'warning' && (
          <>
            <path d="M50 11 93 86H7Z" fill="#F7C600" stroke={K} strokeWidth="5" strokeLinejoin="round" />
            <rect x="46" y="38" width="8" height="25" rx="3" fill={K} />
            <circle cx="50" cy="73" r="4.6" fill={K} />
          </>
        )}
        {kind === 'prohibition' && (
          <>
            <circle cx="50" cy="50" r="38" fill="#fff" stroke="#C8202B" strokeWidth="9" />
            <path d="M24 76 76 24" stroke="#C8202B" strokeWidth="9" strokeLinecap="round" />
          </>
        )}
        {kind === 'evacuation' && (
          <>
            <rect x="10" y="22" width="80" height="56" rx="7" fill="#0B7A4B" />
            <path d="M28 50h38m-12-14 14 14-14 14" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
        {kind === 'mandatory' && (
          <>
            <circle cx="50" cy="50" r="40" fill="#0A57A6" />
            <path d="m30 52 14 14 27-30" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
        {kind === 'info' && (
          <>
            <rect x="12" y="12" width="76" height="76" rx="9" fill="#0A57A6" />
            <circle cx="50" cy="31" r="5.5" fill="#fff" />
            <rect x="45" y="42" width="10" height="30" rx="3" fill="#fff" />
          </>
        )}
        {kind === 'traffic' && (
          <>
            <rect x="21" y="21" width="58" height="58" rx="6" transform="rotate(45 50 50)" fill="#E8710A" stroke={K} strokeWidth="4" />
            <path d="M32 58h36M38 58V42m12 16V42m12 16V42" stroke={K} strokeWidth="5" strokeLinecap="round" />
          </>
        )}
        {kind === 'generic' && (
          <>
            <rect x="12" y="20" width="76" height="60" rx="7" fill="#0E2447" />
            <rect x="12" y="44" width="76" height="12" fill="#F7C600" />
          </>
        )}
      </svg>
    </div>
  )
}
