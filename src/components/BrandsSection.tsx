import React, { useState, useMemo } from 'react';
import { BrandPartner } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface BrandsSectionProps {
  brands: BrandPartner[];
  onOpenContactModal: () => void;
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({
  brands = [],
  onOpenContactModal,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'past'>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeBrands = useMemo(() => brands.filter((b) => b.status === 'active'), [brands]);
  const pastBrands = useMemo(() => brands.filter((b) => b.status === 'past'), [brands]);

  const filteredBrands = useMemo(() => {
    if (activeFilter === 'active') return activeBrands;
    if (activeFilter === 'past') return pastBrands;
    return brands;
  }, [brands, activeFilter, activeBrands, pastBrands]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="brands-section" className="brands-section relative py-12">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1810]">
          Marcas & <span className="italic text-[#7B4B2A]">Parcerias</span>
        </h2>

        <p className="text-sm sm:text-base text-[#7B4B2A] font-light leading-relaxed">
          Marcas que confiam na minha voz para conectar produtos a uma audiência real e engajada. 
          Conheça as marcas que trabalho atualmente e o histórico de campanhas realizadas.
        </p>
      </div>

      {/* Filter Tabs & Quick Stats */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'bg-[#4A2E1F] text-[#FAF7F2] shadow-sm'
              : 'bg-[#FAF7F2] text-[#7B4B2A] hover:bg-[#F5EFE9] border border-[#7B4B2A]/20'
          }`}
        >
          <span>Todas as Marcas</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'all' ? 'bg-[#D4AF37]/30 text-[#FAF7F2]' : 'bg-[#7B4B2A]/10 text-[#4A2E1F]'
            }`}
          >
            {brands.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('active')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeFilter === 'active'
              ? 'bg-[#4A2E1F] text-[#FAF7F2] shadow-sm'
              : 'bg-[#FAF7F2] text-[#7B4B2A] hover:bg-[#F5EFE9] border border-[#7B4B2A]/20'
          }`}
        >
          <span>Trabalho Atual (Ativas)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'active' ? 'bg-[#D4AF37]/30 text-[#FAF7F2]' : 'bg-[#7B4B2A]/10 text-[#4A2E1F]'
            }`}
          >
            {activeBrands.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('past')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeFilter === 'past'
              ? 'bg-[#4A2E1F] text-[#FAF7F2] shadow-sm'
              : 'bg-[#FAF7F2] text-[#7B4B2A] hover:bg-[#F5EFE9] border border-[#7B4B2A]/20'
          }`}
        >
          <span>Já Trabalhou (Histórico)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === 'past' ? 'bg-[#D4AF37]/30 text-[#FAF7F2]' : 'bg-[#7B4B2A]/10 text-[#4A2E1F]'
            }`}
          >
            {pastBrands.length}
          </span>
        </button>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="bg-[#FAF7F2] border border-[#7B4B2A]/15 rounded-3xl p-10 text-center max-w-md mx-auto space-y-3">
          <p className="font-serif text-lg text-[#4A2E1F]">Nenhuma marca encontrada nesta categoria.</p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="text-xs text-[#B8860B] font-semibold hover:underline cursor-pointer"
          >
            Ver todas as marcas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredBrands.map((brand) => {
            const hasImageFailed = failedImages[brand.id] || !brand.logoUrl;
            const initials = brand.name
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={brand.id}
                className="group relative bg-[#FAF7F2] rounded-3xl p-6 sm:p-7 border border-[#7B4B2A]/20 hover:border-[#D4AF37] transition-all duration-300 warm-shadow flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
              >
                {/* Modern Editorial Logo Showcase Frame */}
                <div className="relative w-full h-32 sm:h-36 rounded-2xl bg-gradient-to-b from-white/80 via-[#FAF7F2]/60 to-[#F5EFE9]/40 border border-[#D4AF37]/35 group-hover:border-[#B8860B] p-4 pt-7 flex items-center justify-center mb-5 transition-all duration-300 shadow-[0_2px_12px_-4px_rgba(123,75,42,0.06)] group-hover:shadow-[0_6px_20px_-4px_rgba(212,175,55,0.22)]">
                  {/* Status Indicator */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {brand.status === 'active' ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-emerald-500/35 text-[11px] font-medium text-emerald-800 shadow-2xs backdrop-blur-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>Ativa no momento</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-[#7B4B2A]/20 text-[11px] font-medium text-[#7B4B2A] shadow-2xs backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]" />
                        <span>Campanha entregue</span>
                      </div>
                    )}
                  </div>

                  {/* Subtle corner detail for a bespoke editorial finish */}
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40 group-hover:bg-[#B8860B] transition-colors" />

                  {!hasImageFailed ? (
                    <img
                      src={brand.logoUrl}
                      alt={`Logo da marca ${brand.name}`}
                      onError={() => handleImageError(brand.id)}
                      className="max-h-full max-w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center space-y-1.5">
                      <div className="w-12 h-12 rounded-xl bg-white/80 border border-[#D4AF37]/50 mx-auto flex items-center justify-center shadow-2xs">
                        <span className="font-serif font-bold text-base text-[#4A2E1F]">{initials || 'BK'}</span>
                      </div>
                      <span className="block font-serif font-semibold text-sm text-[#2C1810]">
                        {brand.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-2xl text-[#2C1810] font-bold tracking-tight group-hover:text-[#B8860B] transition-colors leading-snug">
                        {brand.name}
                      </h3>
                      {brand.category && (
                        <p className="text-xs uppercase tracking-wider text-[#8C5E3C] font-semibold mt-0.5">
                          {brand.category}
                        </p>
                      )}
                    </div>

                    {brand.websiteUrl && (
                      <a
                        href={brand.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#7B4B2A] hover:text-[#B8860B] transition-colors p-1.5 rounded-lg shrink-0"
                        title={`Visitar ${brand.name}`}
                      >
                        <span className="hidden sm:inline">Visitar</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {brand.campaignType && (
                    <p className="text-sm sm:text-base text-[#4A2E1F]/90 font-normal leading-relaxed pt-1">
                      {brand.campaignType}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conversion Banner: "Sua Marca Aqui" */}
      <div className="mt-12 bg-gradient-to-r from-[#FAF7F2] via-[#F5EFE9] to-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/40 warm-shadow flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="font-serif text-xl sm:text-2xl text-[#2C1810] font-bold">
            Gostaria de ver sua marca em destaque neste portfólio?
          </h3>
          <p className="text-xs sm:text-sm text-[#7B4B2A] font-light max-w-xl">
            Vamos planejar ações personalizadas para o público de Sophia Menezes com alto engajamento e métricas transparentes.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenContactModal}
          className="shrink-0 bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer group"
        >
          <span>Solicitar Proposta Comercial</span>
          <ArrowUpRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </section>
  );
};
