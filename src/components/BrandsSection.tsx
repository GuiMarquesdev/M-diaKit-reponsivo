import React, { useState, useMemo } from 'react';
import { BrandPartner } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface BrandsSectionProps {
  brands: BrandPartner[];
  onOpenContactModal: () => void;
}

// Helper to generate modern picture sources with 1x, 2x, 3x HiDPI srcset
interface BrandSourceSet {
  webpSrcSet?: string;
  fallbackUrl: string;
}

const getBrandPictureSources = (url?: string, brandId?: string, brandName?: string): BrandSourceSet => {
  // Determine if this is one of our static brand assets (brand-1 to brand-6)
  let staticIndex = '';
  if (brandId === 'brand-1' || brandName === 'Forever Liss') staticIndex = '1';
  else if (brandId === 'brand-2' || brandName === 'L’Oréal Paris' || brandName === "L'Oreal Paris") staticIndex = '2';
  else if (brandId === 'brand-3' || brandName === 'TopWay') staticIndex = '3';
  else if (brandId === 'brand-4' || brandName === 'Haskell') staticIndex = '4';
  else if (brandId === 'brand-5' || brandName === 'Red Bull') staticIndex = '5';
  else if (brandId === 'brand-7' || brandName?.includes('Look de Hoje')) staticIndex = '6';

  if (staticIndex) {
    const v = '1080p_r6';
    return {
      webpSrcSet: `/brand-images/brand-${staticIndex}_sharp.webp?v=${v} 1x, /brand-images/brand-${staticIndex}_sharp.webp?v=${v} 2x`,
      fallbackUrl: `/brand-images/brand-${staticIndex}_sharp.webp?v=${v}`,
    };
  }

  // Unsplash images support dynamic retina srcset
  if (url && url.includes('images.unsplash.com')) {
    const cleanUrl = url.split('&w=')[0].split('?w=')[0];
    const baseParams = cleanUrl.includes('?') ? cleanUrl : `${cleanUrl}?auto=format&fit=crop`;
    return {
      webpSrcSet: `${baseParams}&w=450&q=85 450w, ${baseParams}&w=900&q=90 900w, ${baseParams}&w=1400&q=95 1400w`,
      fallbackUrl: `${baseParams}&w=900&q=90`,
    };
  }

  const fallback = url || '/brand-images/brand-1.webp?v=1080p_r5';
  return {
    fallbackUrl: fallback,
  };
};

const getHighResImageUrl = (url?: string, brandId?: string, brandName?: string): string => {
  return getBrandPictureSources(url, brandId, brandName).fallbackUrl;
};

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

  const handleImageError = (url: string) => {
    if (!url) return;
    setFailedImages((prev) => ({ ...prev, [url]: true }));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredBrands.map((brand) => {
            const hasImageFailed = !brand.logoUrl || failedImages[brand.logoUrl];
            const initials = brand.name
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const isContain = brand.imageFit === 'contain';
            const brandSources = getBrandPictureSources(brand.logoUrl, brand.id, brand.name);

            return (
              <div
                key={brand.id}
                className="group relative bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#7B4B2A]/20 hover:border-[#D4AF37] transition-all duration-300 warm-shadow flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg"
              >
                {/* Modern Editorial Campaign & Logo Showcase Frame - Native crisp scale with ambient background */}
                <div
                  className={`relative w-full h-44 sm:h-48 rounded-xl overflow-hidden mb-4 transition-all duration-300 shadow-xs group-hover:shadow-md select-none flex items-center justify-center ${
                    isContain
                      ? 'bg-white border border-[#7B4B2A]/15 group-hover:border-[#D4AF37]'
                      : 'bg-gradient-to-b from-[#2C1810]/5 via-[#FAF7F2] to-[#7B4B2A]/10 border border-[#7B4B2A]/15 group-hover:border-[#D4AF37]'
                  }`}
                >
                  {/* Ambient Blurred Backdrop to avoid empty bars while keeping image at 100% natural sharpness */}
                  {!isContain && !hasImageFailed && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-25 blur-md scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${brandSources.fallbackUrl})` }}
                    />
                  )}

                  {/* Status Indicator Floating Glass Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    {brand.status === 'active' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 border border-emerald-400/40 text-[11px] font-semibold text-emerald-300 shadow-sm backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span>Parceria Ativa</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 border border-[#D4AF37]/40 text-[11px] font-semibold text-[#FAF7F2] shadow-sm backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span>Campanha Entregue</span>
                      </div>
                    )}
                  </div>

                  {/* High-Resolution Picture Element with WebP HiDPI srcset */}
                  {!hasImageFailed ? (
                    <picture className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                      {brandSources.webpSrcSet && (
                        <source
                          type="image/webp"
                          srcSet={brandSources.webpSrcSet}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                        />
                      )}
                      <img
                        src={brandSources.fallbackUrl}
                        alt={`Campanha ou marca ${brand.name}`}
                        onError={() => handleImageError(brandSources.fallbackUrl)}
                        className={`transition-transform duration-500 ease-out group-hover:scale-102 will-change-transform crisp-img ${
                          isContain
                            ? 'max-w-full max-h-full w-auto h-auto object-contain p-5'
                            : 'h-full w-auto max-w-full object-contain mx-auto'
                        }`}
                        style={{
                          objectPosition: brand.imageAlignment || (isContain ? 'center center' : 'center 22%'),
                          transform: brand.imageZoom && brand.imageZoom !== 100 ? `scale(${brand.imageZoom / 100}) translateZ(0)` : 'translateZ(0)',
                          imageRendering: '-webkit-optimize-contrast',
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden',
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  ) : (
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-4 bg-[#FAF7F2]">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-[#D4AF37]/50 flex items-center justify-center shadow-xs mb-2">
                        <span className="font-serif font-bold text-lg text-[#7B4B2A]">{initials || 'BK'}</span>
                      </div>
                      <span className="font-serif font-semibold text-sm text-[#2C1810]">
                        {brand.name}
                      </span>
                    </div>
                  )}

                  {/* Category Pill and Visual Prompt Overlay at Bottom */}
                  {!isContain && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/20 to-transparent z-15 flex items-end justify-between p-3 pointer-events-none">
                      {brand.category ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#2C1810] shadow-xs backdrop-blur-xs">
                          {brand.category}
                        </span>
                      ) : <span />}
                      <span className="text-[10px] text-[#FAF7F2] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-sm flex items-center gap-1">
                        <span>Ampliar foto</span>
                        <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
                      </span>
                    </div>
                  )}
                  {isContain && brand.category && (
                    <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F2] text-[#4A2E1F] border border-[#7B4B2A]/15 shadow-2xs">
                        {brand.category}
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
