export function OpenCodeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 240 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Open Code</title>
      <g clipPath="url(#clip0_1401_86283)">
        <mask height="300" width="240" x="0" y="0">
          <path d="M240 0H0V300H240V0Z" fill="var(--foreground)" />
        </mask>
        <g mask="url(#mask0_1401_86283)">
          <path d="M180 240H60V120H180V240Z" fill="var(--muted-foreground)" />
          <path
            d="M180 60H60V240H180V60ZM240 300H0V0H240V300Z"
            fill="var(--foreground)"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_1401_86283">
          <rect fill="var(--foreground)" height="300" width="240" />
        </clipPath>
      </defs>
    </svg>
  );
}
