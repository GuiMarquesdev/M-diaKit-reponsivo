import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MediaKitPage } from './pages/MediaKitPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  const navigate = useNavigate();

  // Support secret hash or query flags if used
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#admin789459' ||
        hash === '#/admin789459' ||
        params.get('admin789459') === 'true' ||
        params.get('admin789459') === '1'
      ) {
        navigate('/admin789459', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<MediaKitPage />} />
      {/* Novas rotas secretas de administração */}
      <Route path="/admin789459" element={<AdminPage />} />
      <Route path="/login787898" element={<Navigate to="/admin789459" replace />} />
      {/* Bloqueio de rotas convencionais: redireciona para a página inicial pública */}
      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
