import { BackButton } from './BackButton';
import { CityDropdown } from './CityDropdown';
import type { City } from '../../types';

interface NavbarProps {
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  onLogoClick?: () => void;
  city?: string;
  cities?: City[];
  onCitySelect?: (slug: string) => void;
}

export function Navbar({
  showBack = false,
  backLabel,
  onBack,
  onLogoClick,
  city,
  cities,
  onCitySelect,
}: NavbarProps) {
  return (
    <nav
      style={{
        background: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border)',
        height: 52,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div>
        {showBack && onBack ? (
          <BackButton label={backLabel} onClick={onBack} />
        ) : (
          <div
            onClick={onLogoClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: onLogoClick ? 'pointer' : 'default',
            }}
          >
            <img src="/nearly-icon.svg" alt="" width={20} height={20} />
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              nearly.
            </span>
          </div>
        )}
      </div>

      {city && !showBack && cities && onCitySelect && (
        <CityDropdown
          currentCity={city}
          cities={cities}
          onSelect={onCitySelect}
        />
      )}
    </nav>
  );
}
