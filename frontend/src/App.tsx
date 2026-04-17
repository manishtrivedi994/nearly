import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Digest } from './pages/Digest';
import { DigestDetail } from './pages/DigestDetail';
import { Archive } from './pages/Archive';
import { Bookmarks } from './pages/Bookmarks';
import { Search } from './pages/Search';
import { CategoryPage } from './pages/CategoryPage';
import { AuthProvider } from './hooks/useAuth';
import { initGA, trackPageView } from './utils/analytics';

initGA();

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/search" element={<Search />} />
        <Route path="/digest/:citySlug" element={<Digest />} />
        <Route path="/digest/:citySlug/category/:category" element={<CategoryPage />} />
        <Route path="/digest/:citySlug/archive" element={<Archive />} />
        <Route path="/digest/:citySlug/item/:itemIndex" element={<DigestDetail />} />
        {/* date-specific digest — must come after /archive and /item/:itemIndex */}
        <Route path="/digest/:citySlug/:date" element={<Digest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
