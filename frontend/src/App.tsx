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
        <Route path="/digest/:citySlug/item/:itemIndex" element={<DigestDetail />} />
        <Route path="/archive/:citySlug" element={<Archive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
