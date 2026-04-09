interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--color-brand-dark)' : 'var(--color-bg-primary)',
        color: active ? 'var(--color-brand-light)' : 'var(--color-text-secondary)',
        border: active ? 'none' : '1px solid var(--color-border-strong)',
        fontSize: 11,
        fontWeight: 500,
        padding: '4px 12px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'var(--transition-fast)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {label}
    </button>
  );
}
