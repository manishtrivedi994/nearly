import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackButton } from './BackButton';
import { CityDropdown } from './CityDropdown';
import { AuthModal } from '../AuthModal';
import { useAuth } from '../../hooks/useAuth';
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
  streak?: number;
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="4" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" />
    </svg>
  );
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
  streak = 0,
}: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    setSearchOpen(false);
    setSearchValue('');
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

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

      {/* Right: search input (expanded) or controls */}
      {!showBack && (
        searchOpen ? (
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}
          >
            <input
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onBlur={() => { if (!searchValue.trim()) setSearchOpen(false); }}
              placeholder="Search stories…"
              style={{
                height: 30,
                width: 180,
                padding: '0 10px',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchValue(''); }}
              aria-label="Close search"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: 'var(--color-text-muted)',
                padding: 2,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {streak >= 2 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#B85000',
                  background: '#FFF0E0',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                }}
              >
                🔥 {streak} days
              </span>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <SearchIcon />
            </button>
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
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: 'none', border: '1px solid var(--color-border)',
                    borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    color: 'var(--color-text-muted)', padding: '3px 8px',
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                style={{
                  background: 'none', border: '1px solid var(--color-border)',
                  borderRadius: 6, cursor: 'pointer', fontSize: 11,
                  fontWeight: 500, color: 'var(--color-text-primary)', padding: '3px 8px',
                }}
              >
                Sign in
              </button>
            )}
          </div>
        )
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </nav>
  );
}
