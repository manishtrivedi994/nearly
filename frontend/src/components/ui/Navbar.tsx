import { Link } from 'react-router-dom';
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
  archiveHref?: string;
}

export function Navbar({
  showBack = false,
  backLabel,
  onBack,
  onLogoClick,
  city,
  cities,
  onCitySelect,
  archiveHref,
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
      {/* Left: logo or back button */}
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

      {/* Right: bookmarks + archive link + city dropdown */}
      {!showBack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to="/bookmarks"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.3px',
            }}
          >
            Bookmarks
          </Link>
          {archiveHref && (
            <Link
              to={archiveHref}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.3px',
              }}
            >
              Archive
            </Link>
          )}
          {city && cities && onCitySelect && (
            <CityDropdown
              currentCity={city}
              cities={cities}
              onSelect={onCitySelect}
            />
          )}
        </div>
      )}
    </nav>
  );
}
