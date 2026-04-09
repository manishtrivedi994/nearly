import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Digest } from './pages/Digest';
import { DigestDetail } from './pages/DigestDetail';
import { Archive } from './pages/Archive';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/digest/:citySlug" element={<Digest />} />
        <Route path="/digest/:citySlug/archive" element={<Archive />} />
        <Route path="/digest/:citySlug/item/:itemIndex" element={<DigestDetail />} />
        {/* date-specific digest — must come after /archive and /item/:itemIndex */}
        <Route path="/digest/:citySlug/:date" element={<Digest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
