import React, { useState, useEffect, useRef } from 'react';
import { optimizeAndUploadDataUrl } from '../utils/imageOptimizer';
import {
  Sliders,
  Sparkles,
  Move,
  ZoomIn,
  Eye,
  RefreshCw,
  Check,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Crosshair,
  User,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { BrandPartner } from '../types';

interface BrandImageTunerProps {
  brand: BrandPartner;
  onUpdate: (updates: Partial<BrandPartner>) => void;
}

export const BrandImageTuner: React.FC<BrandImageTunerProps> = ({ brand, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancementSuccess, setEnhancementSuccess] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Parse current alignment or fallback to default
  const parseCoordinates = (alignmentStr?: string): { x: number; y: number } => {
    if (!alignmentStr) return { x: 50, y: 22 };
    const parts = alignmentStr.trim().split(/\s+/);
    if (parts.length === 2) {
      const x = parseFloat(parts[0].replace('%', ''));
      const y = parseFloat(parts[1].replace('%', ''));
      return {
        x: isNaN(x) ? 50 : Math.max(0, Math.min(100, Math.round(x))),
        y: isNaN(y) ? 22 : Math.max(0, Math.min(100, Math.round(y))),
      };
    }
    return { x: 50, y: 22 };
  };

  const { x: posX, y: posY } = parseCoordinates(brand.imageAlignment);
  const zoomLevel = brand.imageZoom || 100;
  const resolutionProfile = brand.imageResolution || '1200p';
  const isContain = brand.imageFit === 'contain';

  // Read native image dimensions when logoUrl changes
  useEffect(() => {
    if (!brand.logoUrl) {
      setImgNaturalSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = brand.logoUrl;
  }, [brand.logoUrl]);

  // Handle alignment change
  const handlePositionChange = (newX: number, newY: number) => {
    const clampedX = Math.max(0, Math.min(100, Math.round(newX)));
    const clampedY = Math.max(0, Math.min(100, Math.round(newY)));
    onUpdate({ imageAlignment: `${clampedX}% ${clampedY}%` });
  };

  // Preset alignment shortcuts
  const ALIGNMENT_PRESETS = [
    { label: 'Rosto / Retrato', icon: User, x: 50, y: 18, desc: 'Foco superior ideal para fotos pessoais' },
    { label: 'Centro Perfeito', icon: Target, x: 50, y: 50, desc: 'Enquadramento centralizado padrão' },
    { label: 'Topo', icon: ArrowUp, x: 50, y: 0, desc: 'Alinhado ao topo' },
    { label: 'Base / Produto', icon: ArrowDown, x: 50, y: 82, desc: 'Foco inferior para produtos na mão' },
    { label: 'Esquerda', icon: ArrowLeft, x: 20, y: 50, desc: 'Foco na lateral esquerda' },
    { label: 'Direita', icon: ArrowRight, x: 80, y: 50, desc: 'Foco na lateral direita' },
  ];

  // Super-Resolution Enhancer: Upscales and sharpens using high-precision bicubic filter on canvas
  const handleEnhanceResolution = async () => {
    if (!brand.logoUrl) return;
    setIsProcessing(true);
    setEnhancementSuccess(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const targetDim = resolutionProfile === '1600p' ? 1600 : resolutionProfile === '800p' ? 800 : 1200;
      const path = `mediakit/brands/${brand.id}-${Date.now()}.webp`;
      const res = await optimizeAndUploadDataUrl(brand.logoUrl, path, {
        maxDimension: targetDim,
        quality: 0.93,
      });

      onUpdate({
        logoUrl: res.url,
        imageResolution: resolutionProfile,
      });

      setImgNaturalSize({ width: res.width, height: res.height });
      setEnhancementSuccess(`Resolução aprimorada com sucesso para ${res.width} × ${res.height} px (${res.sizeKb} KB, WebP HD Ultra)!`);
      setTimeout(() => setEnhancementSuccess(null), 4500);
    } catch (err: any) {
      console.error('Falha ao aprimorar resolução:', err);
      alert('Não foi possível aprimorar a resolução desta imagem automaticamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!brand.logoUrl) return null;

  return (
    <div className="mt-3 border border-[#D4AF37]/35 rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE9] p-3.5 sm:p-4 shadow-2xs space-y-4">
      {/* Header bar of the tuner */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#4A2E1F] text-[#FAF7F2] flex items-center justify-center shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div>
            <h5 className="font-serif text-xs sm:text-sm font-bold text-[#2C1810] flex items-center gap-1.5">
              <span>Ajuste de Alinhamento & Resolução</span>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#2C1810]">
                Pro Tool
              </span>
            </h5>
            <p className="text-[11px] text-[#7B4B2A]">
              Calibre o ponto focal da foto e selecione a nitidez ideal para marcas e visitantes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#7B4B2A]/20 hover:border-[#D4AF37] text-xs font-semibold text-[#4A2E1F] shadow-2xs transition-all cursor-pointer"
        >
          {isOpen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Ocultar Ferramentas</span>
            </>
          ) : (
            <>
              <Sliders className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Personalizar Alinhamento & Resolução</span>
            </>
          )}
        </button>
      </div>

      {/* Main Tuner Body (Expanded or Collapsed preview) */}
      {isOpen && (
        <div className="pt-2 border-t border-[#7B4B2A]/15 space-y-5 animate-fadeIn">
          
          {/* Top Section: Real-time Live Mirror Preview + 2D Interactive Target Pin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            
            {/* Left: 2D Target Focal Box */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#7B4B2A]/20 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C1810] flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Ponto Focal (Clique para posicionar)</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-[#7B4B2A] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#7B4B2A]/15">
                  X: {posX}% • Y: {posY}%
                </span>
              </div>

              {/* Interactive Target Clickpad */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  handlePositionChange(x, y);
                }}
                className="relative w-full h-44 rounded-xl overflow-hidden bg-[#2C1810]/5 border-2 border-dashed border-[#D4AF37]/50 cursor-crosshair select-none group"
                title="Clique em qualquer lugar da imagem para definir o foco"
              >
                {/* Background ghost of the actual image */}
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                  style={{
                    objectPosition: `${posX}% ${posY}%`,
                    transform: `scale(${zoomLevel / 100})`,
                  }}
                />

                {/* Grid Overlay Guides */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="" />
                </div>

                {/* Target Pin Marker */}
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150"
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                >
                  <span className="relative flex h-7 w-7 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-65" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-[#4A2E1F] border-2 border-white items-center justify-center shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                    </span>
                  </span>
                </div>

                {/* Helpful Instruction Tip */}
                <div className="absolute bottom-1.5 inset-x-2 text-center pointer-events-none">
                  <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs">
                    Clique na foto onde deseja manter o foco
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#7B4B2A] tracking-wider block">
                  Enquadramentos Rápidos:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALIGNMENT_PRESETS.map((preset) => {
                    const PresetIcon = preset.icon;
                    const isSelected = posX === preset.x && posY === preset.y;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePositionChange(preset.x, preset.y)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#4A2E1F] text-[#FAF7F2] shadow-2xs font-bold'
                            : 'bg-[#FAF7F2] text-[#7B4B2A] border border-[#7B4B2A]/15 hover:bg-[#F5EFE9]'
                        }`}
                        title={preset.desc}
                      >
                        <PresetIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Preview in True Public Card Frame */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#7B4B2A]/20 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C1810] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Prévia em Tempo Real (Como o visitante vê)</span>
                </span>
              </div>

              {/* Card Mirror Frame */}
              <div
                className={`relative w-full h-44 rounded-xl overflow-hidden border shadow-xs transition-all ${
                  isContain ? 'bg-white border-[#7B4B2A]/15' : 'bg-[#F4EFEA] border-[#7B4B2A]/20'
                }`}
              >
                {/* Floating active badge */}
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/65 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                    {brand.status === 'active' ? '● Parceria Ativa' : '● Histórico'}
                  </span>
                </div>

                {/* Simulated Public Image */}
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className={`w-full h-full transition-transform duration-150 ${
                    isContain ? 'object-contain p-4' : 'object-cover'
                  }`}
                  style={{
                    objectPosition: `${posX}% ${posY}%`,
                    transform: isContain ? 'none' : `scale(${zoomLevel / 100})`,
                    imageRendering: 'auto',
                  }}
                />

                {/* Bottom gradient and tag */}
                {!isContain && (
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/55 to-transparent flex items-end p-2 pointer-events-none">
                    <span className="text-[9px] font-bold text-[#FAF7F2] uppercase tracking-wider drop-shadow-sm truncate">
                      {brand.category || 'Campanha'}
                    </span>
                  </div>
                )}
              </div>

              {/* Status info bar */}
              <div className="flex items-center justify-between text-[11px] text-[#7B4B2A] pt-1">
                <span>
                  {isContain ? 'Modo: Logo Contido (Sem cortes)' : 'Modo: Quadro Editorial Preenchido'}
                </span>
                <span className="font-mono font-bold text-[#4A2E1F]">
                  Escala: {zoomLevel}%
                </span>
              </div>
            </div>
          </div>

          {/* Precision Sliders (Vertical Y, Horizontal X, Zoom) */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#7B4B2A]/20 space-y-3.5 shadow-2xs">
            <span className="text-xs font-bold text-[#2C1810] block">
              Controles Deslizantes de Precisão
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Vertical Y Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7B4B2A]">Alinhamento Vertical (Y)</span>
                  <span className="font-mono font-bold text-[#2C1810] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#7B4B2A]/15">
                    {posY}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posY}
                  onChange={(e) => handlePositionChange(posX, Number(e.target.value))}
                  className="w-full h-1.5 bg-[#FAF7F2] rounded-lg appearance-none cursor-pointer accent-[#4A2E1F]"
                />
                <div className="flex justify-between text-[10px] text-[#7B4B2A]/70">
                  <span>Topo (0%)</span>
                  <span>Rosto (20%)</span>
                  <span>Base (100%)</span>
                </div>
              </div>

              {/* Horizontal X Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7B4B2A]">Alinhamento Horizontal (X)</span>
                  <span className="font-mono font-bold text-[#2C1810] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#7B4B2A]/15">
                    {posX}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posX}
                  onChange={(e) => handlePositionChange(Number(e.target.value), posY)}
                  className="w-full h-1.5 bg-[#FAF7F2] rounded-lg appearance-none cursor-pointer accent-[#4A2E1F]"
                />
                <div className="flex justify-between text-[10px] text-[#7B4B2A]/70">
                  <span>Esquerda (0%)</span>
                  <span>Centro (50%)</span>
                  <span>Direita (100%)</span>
                </div>
              </div>

              {/* Zoom / Scale Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7B4B2A]">Zoom / Enquadramento</span>
                  <span className="font-mono font-bold text-[#2C1810] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#7B4B2A]/15">
                    {zoomLevel}%
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="150"
                  step="2"
                  value={zoomLevel}
                  onChange={(e) => onUpdate({ imageZoom: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#FAF7F2] rounded-lg appearance-none cursor-pointer accent-[#4A2E1F]"
                />
                <div className="flex justify-between text-[10px] text-[#7B4B2A]/70">
                  <span>100% (Normal)</span>
                  <span>125%</span>
                  <span>150% (Aproximado)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution & Super-Sampling Tool */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#7B4B2A]/20 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-[#2C1810] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Resolução & Qualidade Fotográfica</span>
                </span>
                <p className="text-[11px] text-[#7B4B2A]">
                  Escolha o perfil de resolução para telas de alta densidade (Retina, Mac e 4K).
                </p>
              </div>

              {imgNaturalSize && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#7B4B2A] block">
                    Dimensões da Imagem:
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2C1810]">
                    {imgNaturalSize.width} × {imgNaturalSize.height} px
                  </span>
                </div>
              )}
            </div>

            {/* Profile Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ imageResolution: '1200p' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionProfile === '1200p'
                    ? 'border-[#4A2E1F] bg-[#4A2E1F] text-white shadow-2xs'
                    : 'border-[#7B4B2A]/20 bg-[#FAF7F2] text-[#2C1810] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">1200px Retina HD</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${resolutionProfile === '1200p' ? 'bg-[#D4AF37] text-[#2C1810] font-bold' : 'bg-[#7B4B2A]/10 text-[#7B4B2A]'}`}>
                    Recomendado
                  </span>
                </div>
                <p className={`text-[10px] mt-1 ${resolutionProfile === '1200p' ? 'text-white/80' : 'text-[#7B4B2A]'}`}>
                  Equilíbrio perfeito de nitidez para celulares modernos e carregamento ultrarrápido.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdate({ imageResolution: '1600p' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionProfile === '1600p'
                    ? 'border-[#4A2E1F] bg-[#4A2E1F] text-white shadow-2xs'
                    : 'border-[#7B4B2A]/20 bg-[#FAF7F2] text-[#2C1810] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">1600px Ultra HD 4K</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${resolutionProfile === '1600p' ? 'bg-[#D4AF37] text-[#2C1810] font-bold' : 'bg-[#7B4B2A]/10 text-[#7B4B2A]'}`}>
                    Máxima
                  </span>
                </div>
                <p className={`text-[10px] mt-1 ${resolutionProfile === '1600p' ? 'text-white/80' : 'text-[#7B4B2A]'}`}>
                  Nitidez cinematográfica para telas grandes e monitores de alta definição.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdate({ imageResolution: '800p' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionProfile === '800p'
                    ? 'border-[#4A2E1F] bg-[#4A2E1F] text-white shadow-2xs'
                    : 'border-[#7B4B2A]/20 bg-[#FAF7F2] text-[#2C1810] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">800px Otimizado</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${resolutionProfile === '800p' ? 'bg-[#D4AF37] text-[#2C1810] font-bold' : 'bg-[#7B4B2A]/10 text-[#7B4B2A]'}`}>
                    Leve
                  </span>
                </div>
                <p className={`text-[10px] mt-1 ${resolutionProfile === '800p' ? 'text-white/80' : 'text-[#7B4B2A]'}`}>
                  Focado em economia de dados e carregamento mais leve.
                </p>
              </button>
            </div>

            {/* Action to re-process image right now */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#7B4B2A]/15">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleEnhanceResolution}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4A2E1F] to-[#7B4B2A] hover:from-[#2C1810] hover:to-[#4A2E1F] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[#D4AF37] ${isProcessing ? 'animate-spin' : ''}`} />
                <span>
                  {isProcessing ? 'Aprimorando Resolução...' : 'Aprimorar & Otimizar Resolução Agora'}
                </span>
              </button>

              {enhancementSuccess && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{enhancementSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
