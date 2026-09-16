import React from 'react';
import {
  Users,
  MapPin,
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Percent,
} from 'lucide-react';
import { MediaKitData, DemographicsAge, DemographicsCity } from '../types';
import { OFFICIAL_SOCIAL_LINKS } from '../constants';
import { TikTokIcon } from './SocialIcons';

interface AdminTikTokEditorProps {
  tiktok: MediaKitData['tiktok'];
  onChange: (updated: MediaKitData['tiktok']) => void;
}

const DEFAULT_TIKTOK_AGE_DATA: DemographicsAge[] = [
  { range: '18 - 24 anos', percent: 46 },
  { range: '25 - 34 anos', percent: 41 },
  { range: '35+ anos', percent: 13 },
];

const DEFAULT_TIKTOK_CITY_DATA: DemographicsCity[] = [
  { city: 'São Paulo', percent: 38 },
  { city: 'Rio de Janeiro', percent: 22 },
  { city: 'Brasília', percent: 14 },
  { city: 'Porto Alegre', percent: 11 },
  { city: 'Outras', percent: 15 },
];

export const AdminTikTokEditor: React.FC<AdminTikTokEditorProps> = ({
  tiktok,
  onChange,
}) => {
  const ageList = tiktok.ageData && tiktok.ageData.length > 0 ? tiktok.ageData : DEFAULT_TIKTOK_AGE_DATA;
  const cityList = tiktok.cityData && tiktok.cityData.length > 0 ? tiktok.cityData : DEFAULT_TIKTOK_CITY_DATA;

  const totalAgePercent = ageList.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
  const highestAgePercent = Math.max(...ageList.map((item) => Number(item.percent) || 0));

  const handleFieldChange = (field: keyof MediaKitData['tiktok'], value: any) => {
    onChange({
      ...tiktok,
      [field]: value,
    });
  };

  const handleAgeChange = (index: number, field: keyof DemographicsAge, value: any) => {
    const updated = [...ageList];
    updated[index] = {
      ...updated[index],
      [field]: field === 'percent' ? Math.max(0, Math.min(100, Number(value) || 0)) : String(value),
    };
    onChange({
      ...tiktok,
      ageData: updated,
    });
  };

  const handleAddAge = () => {
    onChange({
      ...tiktok,
      ageData: [...ageList, { range: '35 - 44 anos', percent: 10 }],
    });
  };

  const handleRemoveAge = (index: number) => {
    if (ageList.length <= 1) return;
    onChange({
      ...tiktok,
      ageData: ageList.filter((_, idx) => idx !== index),
    });
  };

  const handleResetAges = () => {
    onChange({
      ...tiktok,
      ageData: [...DEFAULT_TIKTOK_AGE_DATA],
    });
  };

  const handleCityChange = (index: number, field: keyof DemographicsCity, value: any) => {
    const updated = [...cityList];
    updated[index] = {
      ...updated[index],
      [field]: field === 'percent' ? Math.max(0, Math.min(100, Number(value) || 0)) : String(value),
    };
    onChange({
      ...tiktok,
      cityData: updated,
    });
  };

  const handleAddCity = () => {
    onChange({
      ...tiktok,
      cityData: [...cityList, { city: 'Nova Cidade', percent: 5 }],
    });
  };

  const handleRemoveCity = (index: number) => {
    if (cityList.length <= 1) return;
    onChange({
      ...tiktok,
      cityData: cityList.filter((_, idx) => idx !== index),
    });
  };

  const handleResetCities = () => {
    onChange({
      ...tiktok,
      cityData: [...DEFAULT_TIKTOK_CITY_DATA],
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Métricas TikTok */}
      <div className="bg-white rounded-2xl p-6 border border-[#7B4B2A]/15 warm-shadow space-y-5">
        <div className="flex items-center justify-between border-b border-[#7B4B2A]/10 pb-3">
          <div className="flex items-center gap-2">
            <TikTokIcon className="w-5 h-5 text-[#B8860B]" />
            <h3 className="font-serif text-lg font-bold text-[#2C1810]">
              Estatísticas Gerais do TikTok
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#7B4B2A] uppercase tracking-wider bg-[#F5EFE9] px-2.5 py-1 rounded-full">
            Viral & Reels
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#7B4B2A]">
                Handle (@)
              </label>
              <button
                type="button"
                onClick={() => handleFieldChange('handle', OFFICIAL_SOCIAL_LINKS.tiktok.handle)}
                className="text-[10px] text-[#B8860B] hover:text-[#7B4B2A] font-medium transition-colors cursor-pointer"
                title="Usar handle oficial @sophi.menezes_"
              >
                Padrão ({OFFICIAL_SOCIAL_LINKS.tiktok.handle})
              </button>
            </div>
            <input
              type="text"
              value={tiktok.handle}
              onChange={(e) => handleFieldChange('handle', e.target.value)}
              placeholder={OFFICIAL_SOCIAL_LINKS.tiktok.handle}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#7B4B2A]">
                Link do Perfil TikTok
              </label>
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('profileUrl', OFFICIAL_SOCIAL_LINKS.tiktok.url);
                  handleFieldChange('handle', OFFICIAL_SOCIAL_LINKS.tiktok.handle);
                }}
                className="text-[10px] text-[#B8860B] hover:text-[#7B4B2A] font-medium transition-colors cursor-pointer"
                title="Inserir link oficial do TikTok"
              >
                Usar Link Oficial
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={tiktok.profileUrl || ''}
                onChange={(e) => handleFieldChange('profileUrl', e.target.value)}
                placeholder={OFFICIAL_SOCIAL_LINKS.tiktok.url}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none pr-8"
              />
              <a
                href={tiktok.profileUrl || OFFICIAL_SOCIAL_LINKS.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B8860B] hover:text-[#7B4B2A]"
                title="Testar e abrir perfil oficial no TikTok"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Seguidores
            </span>
            <input
              type="text"
              value={tiktok.followers}
              onChange={(e) => handleFieldChange('followers', e.target.value)}
              placeholder="420K"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Curtidas Totais
            </span>
            <input
              type="text"
              value={tiktok.likes}
              onChange={(e) => handleFieldChange('likes', e.target.value)}
              placeholder="6.8M"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Média Views
            </span>
            <input
              type="text"
              value={tiktok.avgViews}
              onChange={(e) => handleFieldChange('avgViews', e.target.value)}
              placeholder="85K"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Recorde Viral
            </span>
            <input
              type="text"
              value={tiktok.viralRecord}
              onChange={(e) => handleFieldChange('viralRecord', e.target.value)}
              placeholder="2.9M views"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Faixa Etária TikTok */}
      <div className="bg-white rounded-2xl p-6 border border-[#7B4B2A]/15 warm-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7B4B2A]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#B8860B]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C1810]">
                Faixa Etária do TikTok
              </h3>
              <p className="text-xs text-[#7B4B2A] font-light mt-0.5">
                Audiência por idade no perfil do TikTok.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                totalAgePercent === 100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>Soma: {totalAgePercent}%</span>
            </div>

            <button
              type="button"
              onClick={handleResetAges}
              className="text-[11px] text-[#7B4B2A] hover:text-[#2C1810] px-2.5 py-1 rounded-lg border border-[#7B4B2A]/20 hover:bg-[#FAF7F2] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Padrão</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {ageList.map((item, idx) => {
            const isTop = item.percent > 0 && item.percent === highestAgePercent;
            return (
              <div
                key={idx}
                className="p-3 bg-[#FAF7F2]/60 rounded-xl border border-[#7B4B2A]/15 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider mb-1">
                    Intervalo de Idade
                  </label>
                  <input
                    type="text"
                    value={item.range}
                    onChange={(e) => handleAgeChange(idx, 'range', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="w-28 shrink-0">
                  <label className="block text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider mb-1">
                    Porcentagem (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.percent}
                      onChange={(e) => handleAgeChange(idx, 'percent', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-[#B8860B] bg-white border border-[#7B4B2A]/20 rounded-xl focus:border-[#D4AF37] focus:outline-none pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7B4B2A] font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div className="sm:pt-5 shrink-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveAge(idx)}
                    disabled={ageList.length <= 1}
                    className="p-2 text-[#7B4B2A]/60 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddAge}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EADDCE] text-[#4A2E1F] border border-[#7B4B2A]/25 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#B8860B]" />
          <span>Adicionar Faixa Etária</span>
        </button>
      </div>

      {/* 3. Cidades TikTok */}
      <div className="bg-white rounded-2xl p-6 border border-[#7B4B2A]/15 warm-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7B4B2A]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#B8860B]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C1810]">
                Principais Cidades do TikTok
              </h3>
              <p className="text-xs text-[#7B4B2A] font-light mt-0.5">
                Distribuição regional do público do TikTok.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetCities}
            className="text-[11px] text-[#7B4B2A] hover:text-[#2C1810] px-2.5 py-1 rounded-lg border border-[#7B4B2A]/20 hover:bg-[#FAF7F2] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Cidades</span>
          </button>
        </div>

        <div className="space-y-3">
          {cityList.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#FAF7F2]/60 rounded-xl border border-[#7B4B2A]/15 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider mb-1">
                  Cidade / Região
                </label>
                <input
                  type="text"
                  value={item.city}
                  onChange={(e) => handleCityChange(idx, 'city', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="w-28 shrink-0">
                <label className="block text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider mb-1">
                  Porcentagem (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.percent}
                    onChange={(e) => handleCityChange(idx, 'percent', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-[#B8860B] bg-white border border-[#7B4B2A]/20 rounded-xl focus:border-[#D4AF37] focus:outline-none pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7B4B2A] font-bold">
                    %
                  </span>
                </div>
              </div>

              <div className="sm:pt-5 shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveCity(idx)}
                  disabled={cityList.length <= 1}
                  className="p-2 text-[#7B4B2A]/60 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCity}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EADDCE] text-[#4A2E1F] border border-[#7B4B2A]/25 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#B8860B]" />
          <span>Adicionar Cidade</span>
        </button>
      </div>
    </div>
  );
};
