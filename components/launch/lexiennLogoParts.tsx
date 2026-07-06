/** Stylized SVG logo pieces approximating the Lexienn mark for assembly animation. */

export function LexiennLogoBlueSwoosh({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 78 C 8 58, 18 28, 48 18 C 62 14, 72 20, 78 32"
        stroke="url(#lexBlue)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="lexBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4da3ff" />
          <stop offset="100%" stopColor="#0070ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LexiennLogoRedSwoosh({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M102 42 C 108 58, 100 88, 72 98 C 58 102, 48 96, 42 84"
        stroke="url(#lexRed)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="lexRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="100%" stopColor="#d00000" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LexiennLogoBookL({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42 88 L42 38 C 42 32, 48 28, 54 30 L62 34 L62 88 Z"
        fill="url(#lexBook)"
      />
      <path d="M54 34 L54 30 C 48 28, 46 32, 46 36 L46 84 L54 88 Z" fill="#0d2d52" />
      <path d="M62 34 L70 30 C 76 28, 78 32, 78 36 L78 84 L70 88 Z" fill="#1a4a7a" />
      <path d="M42 88 L78 88 C 84 88, 88 92, 88 96 L42 96 Z" fill="#0a2340" />
      <defs>
        <linearGradient id="lexBook" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3d8fd9" />
          <stop offset="100%" stopColor="#1a5a9e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LexiennLogoPageFold({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M46 36 L54 34 L54 84 L46 80 Z"
        fill="rgba(255,255,255,0.35)"
        stroke="#7ec0ff"
        strokeWidth="1"
      />
    </svg>
  );
}

export function LexiennLogoStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M88 24 L92 34 L102 34 L94 40 L97 50 L88 44 L79 50 L82 40 L74 34 L84 34 Z"
        fill="url(#lexStar)"
      />
      <defs>
        <linearGradient id="lexStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c8d8ec" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LexiennLogoComplete({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-complete.png"
      alt=""
      className={className}
      draggable={false}
    />
  );
}
