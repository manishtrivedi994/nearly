interface BackButtonProps {
  label?: string;
  onClick: () => void;
}

export function BackButton({ label = 'Back', onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--color-text-brand)',
        fontSize: 13,
        fontWeight: 500,
        padding: 0,
        opacity: 1,
        transition: 'var(--transition-fast)',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="#1D9E75"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="10 12 6 8 10 4" />
      </svg>
      {label}
    </button>
  );
}
