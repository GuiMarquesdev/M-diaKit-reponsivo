import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPanel } from '../components/AdminPanel';
import { useMediaKitData } from '../hooks/useMediaKitData';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, saving, updateData, resetToDefault } = useMediaKitData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE9] flex items-center justify-center p-6 text-[#2C1810]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg font-semibold text-[#4A2E1F]">Carregando Painel Administrativo...</p>
          <p className="text-xs text-[#7B4B2A]">Acessando rota restrita</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPanel
      isPage={true}
      isOpen={true}
      onClose={() => navigate('/')}
      data={data}
      onSave={updateData}
      onReset={resetToDefault}
      saving={saving}
    />
  );
};
