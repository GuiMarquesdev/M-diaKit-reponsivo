import React from 'react';
import {
  Users,
  MapPin,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Instagram,
  TrendingUp,
  ExternalLink,
  Award,
  BarChart3,
  Percent,
} from 'lucide-react';
import { MediaKitData, DemographicsAge, DemographicsCity } from '../types';
import { OFFICIAL_SOCIAL_LINKS } from '../constants';

interface AdminInstagramEditorProps {
  instagram: MediaKitData['instagram'];
  onChange: (updated: MediaKitData['instagram']) => void;
}

const DEFAULT_AGE_DATA: DemographicsAge[] = [
  { range: '18 - 24 anos', percent: 28 },
  { range: '25 - 34 anos', percent: 54 },
  { range: '35 - 44 anos', percent: 14 },
  { range: '45+ anos', percent: 4 },
];

const DEFAULT_CITY_DATA: DemographicsCity[] = [
  { city: 'São Paulo', percent: 42 },
  { city: 'Rio de Janeiro', percent: 19 },
  { city: 'Belo Horizonte', percent: 12 },
  { city: 'Curitiba', percent: 9 },
  { city: 'Outras capitais', percent: 18 },
];

export const AdminInstagramEditor: React.FC<AdminInstagramEditorProps> = ({
  instagram,
  onChange,
}) => {
  const ageList = instagram.ageData && instagram.ageData.length > 0 ? instagram.ageData : DEFAULT_AGE_DATA;
  const cityList = instagram.cityData && instagram.cityData.length > 0 ? instagram.cityData : DEFAULT_CITY_DATA;

  // Calculate sum of age percentages
  const totalAgePercent = ageList.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
  
  // Find highest percentage age group
  const highestAgePercent = Math.max(...ageList.map((item) => Number(item.percent) || 0));

  // Handle Instagram scalar field changes
  const handleFieldChange = (field: keyof MediaKitData['instagram'], value: any) => {
    onChange({
      ...instagram,
      [field]: value,
    });
  };

  // Handle Age changes
  const handleAgeChange = (index: number, field: keyof DemographicsAge, value: any) => {
    const updated = [...ageList];
    updated[index] = {
      ...updated[index],
      [field]: field === 'percent' ? Math.max(0, Math.min(100, Number(value) || 0)) : String(value),
    };
    onChange({
      ...instagram,
      ageData: updated,
    });
  };

  const handleAddAge = () => {
    const newAge: DemographicsAge = {
      range: '45 - 54 anos',
      percent: 5,
    };
    onChange({
      ...instagram,
      ageData: [...ageList, newAge],
    });
  };

  const handleRemoveAge = (index: number) => {
    if (ageList.length <= 1) return;
    const updated = ageList.filter((_, idx) => idx !== index);
    onChange({
      ...instagram,
      ageData: updated,
    });
  };

  const handleResetAges = () => {
    onChange({
      ...instagram,
      ageData: [...DEFAULT_AGE_DATA],
    });
  };

  // Handle City changes
  const handleCityChange = (index: number, field: keyof DemographicsCity, value: any) => {
    const updated = [...cityList];
    updated[index] = {
      ...updated[index],
      [field]: field === 'percent' ? Math.max(0, Math.min(100, Number(value) || 0)) : String(value),
    };
    onChange({
      ...instagram,
      cityData: updated,
    });
  };

  const handleAddCity = () => {
    const newCity: DemographicsCity = {
      city: 'Nova Cidade',
      percent: 5,
    };
    onChange({
      ...instagram,
      cityData: [...cityList, newCity],
    });
  };

  const handleRemoveCity = (index: number) => {
    if (cityList.length <= 1) return;
    const updated = cityList.filter((_, idx) => idx !== index);
    onChange({
      ...instagram,
      cityData: updated,
    });
  };

  const handleResetCities = () => {
    onChange({
      ...instagram,
      cityData: [...DEFAULT_CITY_DATA],
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Métricas Principais */}
      <div className="bg-white rounded-2xl p-6 border border-[#7B4B2A]/15 warm-shadow space-y-5">
        <div className="flex items-center justify-between border-b border-[#7B4B2A]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Instagram className="w-5 h-5 text-[#B8860B]" />
            <h3 className="font-serif text-lg font-bold text-[#2C1810]">
              Métricas Oficiais do Instagram
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#7B4B2A] uppercase tracking-wider bg-[#F5EFE9] px-2.5 py-1 rounded-full">
            Canal Principal
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
                onClick={() => handleFieldChange('handle', OFFICIAL_SOCIAL_LINKS.instagram.handle)}
                className="text-[10px] text-[#B8860B] hover:text-[#7B4B2A] font-medium transition-colors"
                title="Usar handle oficial @sophi.menezes_"
              >
                Padrão ({OFFICIAL_SOCIAL_LINKS.instagram.handle})
              </button>
            </div>
            <input
              type="text"
              value={instagram.handle}
              onChange={(e) => handleFieldChange('handle', e.target.value)}
              placeholder={OFFICIAL_SOCIAL_LINKS.instagram.handle}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#7B4B2A]">
                Link Direto do Perfil
              </label>
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('profileUrl', OFFICIAL_SOCIAL_LINKS.instagram.url);
                  handleFieldChange('handle', OFFICIAL_SOCIAL_LINKS.instagram.handle);
                }}
                className="text-[10px] text-[#B8860B] hover:text-[#7B4B2A] font-medium transition-colors"
                title="Inserir link oficial do Instagram"
              >
                Usar Link Oficial
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={instagram.profileUrl || ''}
                onChange={(e) => handleFieldChange('profileUrl', e.target.value)}
                placeholder={OFFICIAL_SOCIAL_LINKS.instagram.url}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none pr-8"
              />
              <a
                href={instagram.profileUrl || OFFICIAL_SOCIAL_LINKS.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B8860B] hover:text-[#7B4B2A]"
                title="Testar e abrir perfil oficial"
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
              value={instagram.followers}
              onChange={(e) => handleFieldChange('followers', e.target.value)}
              placeholder="285K"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
            <span className="text-[10px] text-[#7B4B2A]/70 block">Ex: 285K ou 300 mil</span>
          </div>

          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Alcance Mensal
            </span>
            <input
              type="text"
              value={instagram.reach}
              onChange={(e) => handleFieldChange('reach', e.target.value)}
              placeholder="2.4M/mês"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
            <span className="text-[10px] text-[#7B4B2A]/70 block">Ex: 2.4M/mês</span>
          </div>

          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Taxa de Engajamento
            </span>
            <input
              type="text"
              value={instagram.engagement}
              onChange={(e) => handleFieldChange('engagement', e.target.value)}
              placeholder="5.8%"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
            <span className="text-[10px] text-[#7B4B2A]/70 block">Ex: 5.8%</span>
          </div>

          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider block">
              Média Views Reels
            </span>
            <input
              type="text"
              value={instagram.viewsPerReels}
              onChange={(e) => handleFieldChange('viewsPerReels', e.target.value)}
              placeholder="145K+"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
            <span className="text-[10px] text-[#7B4B2A]/70 block">Ex: 145K+</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-1">
            <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#B8860B]" />
              Recorde / Melhor Reels
            </span>
            <input
              type="text"
              value={instagram.bestReelViews || ''}
              onChange={(e) => handleFieldChange('bestReelViews', e.target.value)}
              placeholder="1.2M"
              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
            />
            <span className="text-[10px] text-[#7B4B2A]/70 block">
              Destaque do vídeo de maior alcance orgânico
            </span>
          </div>

          {/* Gênero */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#7B4B2A]/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider">
                Divisão de Gênero
              </span>
              <span className="text-[10px] font-mono font-bold text-[#2C1810]">
                {instagram.femaleAudience}% F • {instagram.maleAudience}% M
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-[#7B4B2A] mb-0.5">Feminino (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={instagram.femaleAudience}
                  onChange={(e) => {
                    const fem = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    onChange({
                      ...instagram,
                      femaleAudience: fem,
                      maleAudience: 100 - fem,
                    });
                  }}
                  className="w-full px-2 py-1 text-xs font-bold bg-white border border-[#7B4B2A]/20 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-[#7B4B2A] mb-0.5">Masculino (%)</label>
                <input
                  type="number"
                  readOnly
                  value={instagram.maleAudience}
                  className="w-full px-2 py-1 text-xs font-bold bg-neutral-100 text-neutral-600 border border-[#7B4B2A]/15 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="h-2 w-full bg-[#E5D7CC] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${instagram.femaleAudience}%` }}
                className="bg-[#B8860B] h-full"
                title={`Feminino: ${instagram.femaleAudience}%`}
              />
              <div
                style={{ width: `${instagram.maleAudience}%` }}
                className="bg-[#7B4B2A] h-full"
                title={`Masculino: ${instagram.maleAudience}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Faixa Etária (Demografia por Idade) */}
      <div className="bg-white rounded-2xl p-6 border border-[#7B4B2A]/15 warm-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7B4B2A]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#B8860B]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C1810] flex items-center gap-2">
                Faixa Etária do Instagram
                <span className="text-[11px] font-sans font-semibold bg-[#D4AF37]/20 text-[#7B4B2A] px-2 py-0.5 rounded-full">
                  Idades da Audiência
                </span>
              </h3>
              <p className="text-xs text-[#7B4B2A] font-light mt-0.5">
                Edite os intervalos de idade e a porcentagem exibida nos gráficos do Mídia Kit.
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
              title={totalAgePercent === 100 ? 'Soma correta em 100%' : 'Aviso: a soma das faixas difere de 100%'}
            >
              <Percent className="w-3 h-3" />
              <span>Soma: {totalAgePercent}%</span>
            </div>

            <button
              type="button"
              onClick={handleResetAges}
              className="text-[11px] text-[#7B4B2A] hover:text-[#2C1810] px-2.5 py-1 rounded-lg border border-[#7B4B2A]/20 hover:bg-[#FAF7F2] transition-colors flex items-center gap-1 cursor-pointer"
              title="Restaurar faixas etárias originais"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Padrão</span>
            </button>
          </div>
        </div>

        {/* Lista de Faixas Etárias */}
        <div className="space-y-3">
          {ageList.map((item, idx) => {
            const isTopAudience = item.percent > 0 && item.percent === highestAgePercent;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTopAudience
                    ? 'bg-[#FAF7F2] border-[#D4AF37]/50 shadow-xs'
                    : 'bg-[#FAF7F2]/60 border-[#7B4B2A]/15 hover:border-[#7B4B2A]/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Badge de Público Principal */}
                  <div className="sm:w-28 shrink-0 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#EADDCE] text-[#4A2E1F] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {isTopAudience && (
                      <span className="text-[10px] bg-[#B8860B] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        Principal
                      </span>
                    )}
                  </div>

                  {/* Intervalo de Idade */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider mb-1">
                      Intervalo de Idade
                    </label>
                    <input
                      type="text"
                      value={item.range}
                      onChange={(e) => handleAgeChange(idx, 'range', e.target.value)}
                      placeholder="Ex: 25 - 34 anos"
                      className="w-full px-3 py-2 text-xs font-semibold text-[#2C1810] bg-white border border-[#7B4B2A]/20 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {/* Porcentagem */}
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

                  {/* Botão de Remover */}
                  <div className="sm:pt-5 shrink-0 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAge(idx)}
                      disabled={ageList.length <= 1}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        ageList.length <= 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-[#7B4B2A]/60 hover:text-red-700 hover:bg-red-50'
                      }`}
                      title="Excluir esta faixa etária"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Preview Bar */}
                <div className="mt-2.5 pt-2 border-t border-[#7B4B2A]/10 flex items-center gap-3">
                  <span className="text-[10px] text-[#7B4B2A]/80 w-16 shrink-0 font-medium">
                    Prévia visual:
                  </span>
                  <div className="h-2 flex-1 bg-[#EADDCE] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(item.percent * 1.8, 100)}%` }}
                      className={`h-full rounded-full transition-all ${
                        isTopAudience
                          ? 'bg-gradient-to-r from-[#7B4B2A] via-[#B8860B] to-[#D4AF37]'
                          : 'bg-[#B8860B]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#B8860B] w-10 text-right shrink-0">
                    {item.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ações de Faixa Etária */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddAge}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EADDCE] text-[#4A2E1F] border border-[#7B4B2A]/25 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B8860B]" />
            <span>Adicionar Faixa Etária</span>
          </button>

          <p className="text-[11px] text-[#7B4B2A]/80 italic">
            * A faixa com maior porcentagem ganha automaticamente o selo dourado de <strong>"Público Principal"</strong> no Mídia Kit.
          </p>
        </div>
      </div>

      {/* 3. Principais Cidades (Localização) */}
      <div className="bg-white rounded-2xl p-6 border border-[#7B4B2A]/15 warm-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7B4B2A]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#B8860B]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C1810]">
                Principais Cidades do Instagram
              </h3>
              <p className="text-xs text-[#7B4B2A] font-light mt-0.5">
                Localização geográfica de onde vêm os seguidores e o alcance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetCities}
            className="text-[11px] text-[#7B4B2A] hover:text-[#2C1810] px-2.5 py-1 rounded-lg border border-[#7B4B2A]/20 hover:bg-[#FAF7F2] transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            title="Restaurar cidades padrão"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Cidades</span>
          </button>
        </div>

        <div className="space-y-3">
          {cityList.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#FAF7F2]/60 rounded-xl border border-[#7B4B2A]/15 hover:border-[#7B4B2A]/30 transition-all flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-[#7B4B2A] uppercase tracking-wider mb-1">
                  Cidade / Região
                </label>
                <input
                  type="text"
                  value={item.city}
                  onChange={(e) => handleCityChange(idx, 'city', e.target.value)}
                  placeholder="Ex: São Paulo"
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
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    cityList.length <= 1
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-[#7B4B2A]/60 hover:text-red-700 hover:bg-red-50'
                  }`}
                  title="Excluir cidade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1">
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
    </div>
  );
};
