import React, { useState, useMemo } from 'react';
import { BrandPartner } from '../types';
import { ArrowUpRight, Maximize2, X, ExternalLink } from 'lucide-react';

interface BrandsSectionProps {
  brands: BrandPartner[];
  onOpenContactModal: () => void;
}

// Helper to ensure crystal-clear retina resolution for Unsplash and static assets
const BRAND_STATIC_HIGH_RES: Record<string, string> = {
  'brand-1': '/brand-images/brand-1.webp',
  'brand-2': '/brand-images/brand-2.webp',
  'brand-3': '/brand-images/brand-3.webp',
  'brand-4': '/brand-images/brand-4.webp',
  'brand-5': '/brand-images/brand-5.webp',
  'brand-7': '/brand-images/brand-6.webp',
};

const getHighResImageUrl = (url?: string, brandId?: string): string => {
  if (brandId && BRAND_STATIC_HIGH_RES[brandId]) {
    // If url is empty or is an old low-res base64 string, seamlessly use the 1200px Retina WebP asset
    if (!url || url.startsWith('data:image/jpeg') || url.startsWith('data:image/png')) {
      return BRAND_STATIC_HIGH_RES[brandId];
    }
  }
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    let enhanced = url;
    if (enhanced.includes('w=')) {
      enhanced = enhanced.replace(/w=\d+/, 'w=1200');
    } else {
      enhanced += '&w=1200';
    }
    if (enhanced.includes('q=')) {
      enhanced = enhanced.replace(/q=\d+/, 'q=90');
    } else {
      enhanced += '&q=90';
    }
    return enhanced;
  }
  return url;
};

export const BrandsSection: React.FC<BrandsSectionProps> = ({
  brands = [],
  onOpenContactModal,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'past'>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [previewBrand, setPreviewBrand] = useState<BrandPartner | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
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
            const highResUrl = getHighResImageUrl(brand.logoUrl, brand.id);
            const isUnsplash = Boolean(brand.logoUrl && brand.logoUrl.includes('images.unsplash.com'));

            return (
              <div
                key={brand.id}
                className="group relative bg-[#FAF7F2] rounded-3xl p-5 sm:p-6 border border-[#7B4B2A]/20 hover:border-[#D4AF37] transition-all duration-300 warm-shadow flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg"
              >
                {/* Modern Editorial Campaign & Logo Showcase Frame */}
                <div
                  className={`relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden mb-5 transition-all duration-300 shadow-xs group-hover:shadow-md cursor-pointer select-none ${
                    isContain
                      ? 'bg-white border border-[#7B4B2A]/15 group-hover:border-[#D4AF37]'
                      : 'bg-[#F4EFEA] border border-[#7B4B2A]/15 group-hover:border-[#D4AF37]'
                  }`}
                  onClick={() => !hasImageFailed && setPreviewBrand(brand)}
                  title="Clique para ampliar o registro de campanha"
                >
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

                  {/* Expand Icon Button in Top Right */}
                  <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="w-7 h-7 rounded-full bg-black/60 border border-white/20 text-[#FAF7F2] flex items-center justify-center backdrop-blur-md shadow-sm hover:scale-110 transition-transform">
                      <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </span>
                  </div>

                  {/* Main Image Showcase */}
                  {!hasImageFailed ? (
                    <img
                      src={highResUrl}
                      srcSet={
                        isUnsplash
                          ? `${brand.logoUrl.replace(/w=\d+/, 'w=600')} 600w, ${highResUrl} 1200w, ${brand.logoUrl.replace(/w=\d+/, 'w=1600')} 1600w`
                          : undefined
                      }
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                      alt={`Campanha ou marca ${brand.name}`}
                      onError={() => handleImageError(brand.logoUrl)}
                      className={`relative z-10 w-full h-full transition-transform duration-500 ease-out group-hover:scale-102 will-change-transform ${
                        isContain
                          ? 'object-contain p-6 sm:p-7'
                          : 'object-cover'
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

      {/* Lightbox Modal for Full Campaign Shoot Preview */}
      {previewBrand && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewBrand(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#1C120C] border border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 text-white space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2]">
                    {previewBrand.name}
                  </h3>
                  {previewBrand.status === 'active' ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                      Parceria Ativa
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F2]/10 text-[#D4AF37] border border-[#D4AF37]/40">
                      Campanha Entregue
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#D4AF37] mt-0.5">
                  {previewBrand.category} • {previewBrand.campaignType}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewBrand(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Fechar visualização"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden max-h-[60vh] bg-black/40 flex items-center justify-center border border-white/10 p-2">
              <img
                src={getHighResImageUrl(previewBrand.logoUrl, previewBrand.id)}
                alt={previewBrand.name}
                className="w-full max-h-[58vh] object-contain rounded-xl"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[#FAF7F2]/80">
                Ensaio e publicidade em parceria com Sophia Menezes.
              </p>

              <div className="flex items-center gap-2">
                {previewBrand.websiteUrl && (
                  <a
                    href={previewBrand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <span>Conhecer Marca</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewBrand(null);
                    onOpenContactModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#D4AF37] hover:bg-[#B8860B] text-[#2C1810] font-bold transition-colors cursor-pointer shadow-md"
                >
                  <span>Proposta Semelhante</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
