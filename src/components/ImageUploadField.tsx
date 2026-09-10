import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  Move,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ImageUploadFieldProps {
  id?: string;
  label: string;
  description?: string;
  value: string;
  position?: string;
  onChange: (newUrlOrBase64: string) => void;
  onPositionChange?: (newPosition: string) => void;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'circle';
  maxDimension?: number;
}

// Compress and convert image file to optimized Base64 Data URL
const compressImageFile = (file: File, maxDimension = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao processar canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

// Parse CSS position string like "50% 20%" to {x: 50, y: 20}
const parsePosition = (pos?: string, defaultY = 50): { x: number; y: number } => {
  if (!pos) return { x: 50, y: defaultY };
  const parts = pos.trim().split(/\s+/);
  if (parts.length === 2) {
    const x = parseFloat(parts[0].replace('%', ''));
    const y = parseFloat(parts[1].replace('%', ''));
    return {
      x: isNaN(x) ? 50 : Math.max(0, Math.min(100, Math.round(x))),
      y: isNaN(y) ? defaultY : Math.max(0, Math.min(100, Math.round(y))),
    };
  }
  return { x: 50, y: defaultY };
};

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  id,
  label,
  description,
  value,
  position = '50% 50%',
  onChange,
  onPositionChange,
  aspectRatio = 'portrait',
  maxDimension = 1200,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [isPositionOpen, setIsPositionOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Position coordinates in percentage (0 - 100)
  const defaultY = aspectRatio === 'portrait' ? 20 : 50;
  const { x: posX, y: posY } = parsePosition(position, defaultY);
  const [currentX, setCurrentX] = useState(posX);
  const [currentY, setCurrentY] = useState(posY);

  // Sync state if position prop changes
  useEffect(() => {
    const parsed = parsePosition(position, defaultY);
    setCurrentX(parsed.x);
    setCurrentY(parsed.y);
  }, [position, defaultY]);

  const updatePos = useCallback(
    (x: number, y: number) => {
      const clampedX = Math.max(0, Math.min(100, Math.round(x)));
      const clampedY = Math.max(0, Math.min(100, Math.round(y)));
      setCurrentX(clampedX);
      setCurrentY(clampedY);
      if (onPositionChange) {
        onPositionChange(`${clampedX}% ${clampedY}%`);
      }
    },
    [onPositionChange]
  );

  const handlePadInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;
    updatePos(percentX, percentY);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const optimizedBase64 = await compressImageFile(file, maxDimension);
      onChange(optimizedBase64);
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao processar imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'aspect-[3/4] max-h-60';
      case 'landscape':
        return 'aspect-[4/3] max-h-60';
      case 'circle':
        return 'w-28 h-28 rounded-full mx-auto';
      case 'square':
      default:
        return 'aspect-square max-h-60';
    }
  };

  const currentPositionStyle = `${currentX}% ${currentY}%`;

  return (
    <div id={id} className="bg-white p-4 rounded-2xl border border-[#7B4B2A]/20 space-y-3 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#2C1810]">{label}</span>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[10px] text-[#7B4B2A] hover:text-[#2C1810] flex items-center gap-1 underline cursor-pointer"
        >
          {isUrlMode ? (
            <>
              <Upload className="w-3 h-3" /> Fazer Upload
            </>
          ) : (
            <>
              <LinkIcon className="w-3 h-3" /> Colar Link
            </>
          )}
        </button>
      </div>

      {description && <p className="text-[11px] text-[#7B4B2A]/80">{description}</p>}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Preview Box & Upload Drop Area */}
      {!isUrlMode ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer overflow-hidden border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center bg-[#FAF7F2] ${
            isDragging
              ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
              : 'border-[#7B4B2A]/30 hover:border-[#7B4B2A]'
          } ${aspectRatio === 'circle' ? 'w-32 h-32 rounded-full mx-auto' : ''}`}
        >
          {value ? (
            <div className={`w-full overflow-hidden relative ${getAspectClass()}`}>
              <img
                src={value}
                alt={label}
                style={{ objectPosition: currentPositionStyle }}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  aspectRatio === 'circle' ? 'rounded-full' : ''
                }`}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white p-2 text-center backdrop-blur-xs">
                <Upload className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[11px] font-bold">Clique para Trocar Foto</span>
                <span className="text-[9px] opacity-80">ou arraste e solte</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#7B4B2A]/10 text-[#7B4B2A] flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#2C1810]">Clique para selecionar foto</p>
              <p className="text-[10px] text-[#7B4B2A]">ou arraste uma imagem aqui</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
              <RefreshCw className="w-6 h-6 text-[#7B4B2A] animate-spin" />
              <span className="text-xs font-semibold text-[#2C1810]">Otimizando imagem...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          {value && (
            <div className={`overflow-hidden rounded-xl border bg-neutral-100 ${getAspectClass()}`}>
              <img
                src={value}
                alt="Preview"
                style={{ objectPosition: currentPositionStyle }}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-[#4A2E1F] hover:bg-[#7B4B2A] text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Upload Foto</span>
          </button>

          {/* Reposition Toggle Button */}
          {value && onPositionChange && (
            <button
              type="button"
              onClick={() => setIsPositionOpen(!isPositionOpen)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isPositionOpen
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#2C1810]'
                  : 'bg-[#FAF7F2] border-[#7B4B2A]/20 hover:border-[#7B4B2A] text-[#4A2E1F]'
              }`}
            >
              <Move className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Ajustar Posição</span>
              {isPositionOpen ? (
                <ChevronUp className="w-3 h-3 text-[#7B4B2A]" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#7B4B2A]" />
              )}
            </button>
          )}
        </div>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Remover imagem"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* =========================================================================
          POSITION & FOCAL POINT ADJUSTER TOOL (TOOL PANEL)
      ========================================================================= */}
      {value && onPositionChange && isPositionOpen && (
        <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#D4AF37]/40 space-y-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#2C1810] flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Enquadramento & Ponto Focal</span>
            </span>
            <span className="text-[10px] text-[#7B4B2A] font-mono font-medium">
              X: {currentX}% • Y: {currentY}%
            </span>
          </div>

          {/* Interactive 2D Focal Pad */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#7B4B2A] font-semibold block">
              1. Clique ou arraste na foto para focar o rosto/sujeito:
            </label>
            <div
              ref={padRef}
              onClick={handlePadInteraction}
              className="relative w-full h-36 bg-neutral-900 rounded-lg overflow-hidden cursor-crosshair border border-[#7B4B2A]/30 select-none group"
            >
              {/* Full Image in background */}
              <img
                src={value}
                alt="Framing map"
                className="w-full h-full object-contain opacity-60 pointer-events-none"
              />
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/10">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>
              {/* Target Reticle Pin */}
              <div
                style={{ left: `${currentX}%`, top: `${currentY}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
              >
                <div className="w-7 h-7 rounded-full border-2 border-[#D4AF37] bg-white/30 backdrop-blur-xs flex items-center justify-center shadow-lg animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#7B4B2A] font-semibold block">
              2. Posições Rápidas:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => updatePos(50, 10)}
                className={`py-1.5 px-1 text-[10px] font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                  currentY <= 25
                    ? 'bg-[#4A2E1F] text-white border-[#4A2E1F]'
                    : 'bg-white text-[#4A2E1F] border-[#7B4B2A]/20 hover:border-[#7B4B2A]'
                }`}
              >
                Topo (Rosto)
              </button>
              <button
                type="button"
                onClick={() => updatePos(50, 50)}
                className={`py-1.5 px-1 text-[10px] font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                  currentY > 25 && currentY < 75 && currentX > 25 && currentX < 75
                    ? 'bg-[#4A2E1F] text-white border-[#4A2E1F]'
                    : 'bg-white text-[#4A2E1F] border-[#7B4B2A]/20 hover:border-[#7B4B2A]'
                }`}
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => updatePos(50, 90)}
                className={`py-1.5 px-1 text-[10px] font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                  currentY >= 75
                    ? 'bg-[#4A2E1F] text-white border-[#4A2E1F]'
                    : 'bg-white text-[#4A2E1F] border-[#7B4B2A]/20 hover:border-[#7B4B2A]'
                }`}
              >
                Base
              </button>
              <button
                type="button"
                onClick={() => updatePos(15, 50)}
                className={`py-1.5 px-1 text-[10px] font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                  currentX <= 25
                    ? 'bg-[#4A2E1F] text-white border-[#4A2E1F]'
                    : 'bg-white text-[#4A2E1F] border-[#7B4B2A]/20 hover:border-[#7B4B2A]'
                }`}
              >
                Esquerda
              </button>
              <button
                type="button"
                onClick={() => updatePos(85, 50)}
                className={`py-1.5 px-1 text-[10px] font-semibold rounded-md border text-center transition-colors cursor-pointer ${
                  currentX >= 75
                    ? 'bg-[#4A2E1F] text-white border-[#4A2E1F]'
                    : 'bg-white text-[#4A2E1F] border-[#7B4B2A]/20 hover:border-[#7B4B2A]'
                }`}
              >
                Direita
              </button>
            </div>
          </div>

          {/* Sliders for Fine Tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Vertical (Y) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#7B4B2A]">
                <span className="font-semibold">Vertical (Y)</span>
                <span>{currentY}% ({currentY < 35 ? 'Topo' : currentY > 65 ? 'Base' : 'Centro'})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentY}
                onChange={(e) => updatePos(currentX, parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#ECE2D8] rounded-lg appearance-none cursor-pointer accent-[#7B4B2A]"
              />
            </div>

            {/* Horizontal (X) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#7B4B2A]">
                <span className="font-semibold">Horizontal (X)</span>
                <span>{currentX}% ({currentX < 35 ? 'Esq.' : currentX > 65 ? 'Dir.' : 'Centro'})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentX}
                onChange={(e) => updatePos(parseInt(e.target.value), currentY)}
                className="w-full h-1.5 bg-[#ECE2D8] rounded-lg appearance-none cursor-pointer accent-[#7B4B2A]"
              />
            </div>
          </div>

          {/* Reset / Confirm */}
          <div className="flex items-center justify-between pt-1 border-t border-[#7B4B2A]/10">
            <button
              type="button"
              onClick={() => updatePos(50, defaultY)}
              className="text-[10px] text-[#7B4B2A] hover:text-[#2C1810] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPositionOpen(false)}
              className="px-3 py-1 bg-[#4A2E1F] hover:bg-[#7B4B2A] text-white text-[10px] font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Check className="w-3 h-3 text-[#D4AF37]" />
              <span>Concluir Ajuste</span>
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-[10px] text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
