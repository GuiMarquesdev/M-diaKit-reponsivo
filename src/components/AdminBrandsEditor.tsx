import React, { useState, useRef } from 'react';
import { BrandPartner } from '../types';
import {
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Save,
  Check,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

interface AdminBrandsEditorProps {
  brands: BrandPartner[];
  onChange: (brands: BrandPartner[]) => void;
  onSaveDirect?: () => Promise<void> | void;
  saving?: boolean;
}

// Preset categories for one-click assignment
const PRESET_CATEGORIES = [
  'Cabelos & Cachos',
  'Skincare & Dermocosméticos',
  'Beleza & Maquiagem',
  'Fitness & Suplementos',
  'Moda & Lifestyle',
  'Saúde & Bem-Estar',
  'Tecnologia & Inovação',
];

// Preset campaign types for quick selection
const PRESET_CAMPAIGNS = [
  'Embaixadora Oficial',
  'Combo Reels + Stories',
  'Lançamento de Produto',
  'Vídeo Dedicado TikTok',
  'Presença VIP & Cobertura',
  'Publipost Feed',
  'Contrato Semestral',
];

// Compress and convert file preserving transparency strictly for PNG/SVG and high quality for JPG/WEBP
const readLogoFile = (file: File): Promise<{ dataUrl: string; sizeKb: number }> => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || fileName.endsWith('.svg');
    const isPng = file.type === 'image/png' || fileName.endsWith('.png');
    const isJpg =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg');
    const isWebp = file.type === 'image/webp' || fileName.endsWith('.webp');

    if (!isSvg && !isPng && !isJpg && !isWebp) {
      reject(new Error('Formato não suportado. Por favor utilize arquivos PNG, JPG, JPEG, WEBP ou SVG.'));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Arquivo muito pesado. O limite máximo para upload é de 8 MB.'));
      return;
    }

    const reader = new FileReader();

    if (isSvg) {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result.length > 80 * 1024) {
          reject(new Error('Arquivo SVG muito complexo (>80 KB). Recomendamos exportar em PNG com fundo transparente.'));
          return;
        }
        const sizeKb = Math.round(result.length / 1024);
        resolve({ dataUrl: result, sizeKb });
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo SVG.'));
      reader.readAsDataURL(file);
      return;
    }

    // Raster images (PNG, JPG, WEBP)
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Max dimension of 260px provides pristine Retina clarity on public cards
        // while maintaining payload around ~12-25 KB
        const maxDimension = 260;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = event.target?.result as string;
          resolve({ dataUrl: raw, sizeKb: Math.round(raw.length / 1024) });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Keep alpha transparency on PNG/WebP; high quality WebP/JPEG for others
        let dataUrl: string;
        if (isPng) {
          dataUrl = canvas.toDataURL('image/png');
        } else if (isWebp) {
          dataUrl = canvas.toDataURL('image/webp', 0.88);
        } else {
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        }

        const sizeKb = Math.round(dataUrl.length / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.onerror = () => reject(new Error('Não foi possível decodificar a imagem informada.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao processar arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
};

export const AdminBrandsEditor: React.FC<AdminBrandsEditorProps> = ({
  brands = [],
  onChange,
  onSaveDirect,
  saving = false,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'past'>('all');
  const [editingId, setEditingId] = useState<string | null>(brands[0]?.id || null);
  const [uploadError, setUploadError] = useState<{ id: string; message: string } | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<{ id: string; sizeKb: number } | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAddBrand = () => {
    const newBrand: BrandPartner = {
      id: `brand-${Date.now()}`,
      name: 'Nova Marca Parceira',
      status: 'active',
      category: 'Beleza & Cuidados',
      campaignType: 'Campanha de Divulgação',
      logoUrl: '',
      websiteUrl: '',
    };
    const updated = [newBrand, ...brands];
    onChange(updated);
    setEditingId(newBrand.id);
  };

  const handleUpdateBrand = (id: string, updates: Partial<BrandPartner>) => {
    const updated = brands.map((b) => (b.id === id ? { ...b, ...updates } : b));
    onChange(updated);
  };

  const handleDeleteBrand = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta marca do seu Mídia Kit?')) {
      const updated = brands.filter((b) => b.id !== id);
      onChange(updated);
      if (editingId === id) {
        setEditingId(updated[0]?.id || null);
      }
    }
  };

  const handleMoveBrand = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= brands.length) return;
    const updated = [...brands];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onChange(updated);
  };

  const processFile = async (brandId: string, file: File) => {
    setUploadError(null);
    try {
      const { dataUrl, sizeKb } = await readLogoFile(file);
      handleUpdateBrand(brandId, { logoUrl: dataUrl });
      setUploadSuccess({ id: brandId, sizeKb });
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error('Erro ao processar imagem de logo:', err);
      setUploadError({ id: brandId, message: err?.message || 'Falha ao processar a imagem.' });
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const handleFileUpload = async (brandId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(brandId, file);
    e.target.value = '';
  };

  const handleDragOver = (brandId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(brandId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);
  };

  const handleDrop = async (brandId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(brandId, file);
    }
  };

  const displayedBrands = brands.filter((b) => {
    if (filterTab === 'active') return b.status === 'active';
    if (filterTab === 'past') return b.status === 'past';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header with Quick Cloud Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#7B4B2A]/15 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-[#2C1810]">
              Marcas & Parcerias Comerciais
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#2C1810]">
              {brands.length} {brands.length === 1 ? 'Marca' : 'Marcas'}
            </span>
          </div>
          <p className="text-xs text-[#7B4B2A] mt-0.5">
            Cadastre as marcas que você atende atualmente ou atendeu no histórico, com textos e logos otimizados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSaveDirect && (
            <button
              type="button"
              onClick={() => onSaveDirect()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Gravando...' : 'Salvar Marcas na Nuvem'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddBrand}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FAF7F2] bg-[#4A2E1F] hover:bg-[#7B4B2A] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Adicionar Marca</span>
          </button>
        </div>
      </div>

      {/* Cloud Storage Notice */}
      <div className="p-3 bg-[#FAF7F2] border border-[#D4AF37]/35 rounded-xl flex items-start gap-2.5 text-xs text-[#7B4B2A]">
        <Info className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
        <div className="flex-1 space-y-0.5">
          <p className="font-semibold text-[#2C1810]">
            Sincronização com o Mídia Kit Público
          </p>
          <p>
            Suporta imagens nos formatos <strong>PNG, JPG, JPEG, WEBP e SVG</strong>. Cada logo é automaticamente redimensionada para máxima nitidez e peso leve, garantindo gravação rápida no banco de dados na nuvem.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'bg-[#4A2E1F] text-[#FAF7F2]'
              : 'bg-white text-[#7B4B2A] border border-[#7B4B2A]/20 hover:bg-[#FAF7F2]'
          }`}
        >
          Todas ({brands.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'active'
              ? 'bg-[#4A2E1F] text-[#FAF7F2]'
              : 'bg-white text-[#7B4B2A] border border-[#7B4B2A]/20 hover:bg-[#FAF7F2]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Atualmente Trabalha ({brands.filter((b) => b.status === 'active').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('past')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'past'
              ? 'bg-[#4A2E1F] text-[#FAF7F2]'
              : 'bg-white text-[#7B4B2A] border border-[#7B4B2A]/20 hover:bg-[#FAF7F2]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
          <span>Já Trabalhou ({brands.filter((b) => b.status === 'past').length})</span>
        </button>
      </div>

      {/* Brands List */}
      {displayedBrands.length === 0 ? (
        <div className="bg-white border border-[#7B4B2A]/15 rounded-2xl p-8 text-center space-y-3">
          <Briefcase className="w-8 h-8 text-[#B8860B] mx-auto" />
          <p className="font-serif text-base text-[#4A2E1F]">Nenhuma marca cadastrada nesta aba.</p>
          <button
            type="button"
            onClick={handleAddBrand}
            className="text-xs text-[#B8860B] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar primeira marca</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBrands.map((brand, index) => {
            const isEditing = editingId === brand.id;
            const isBrandDragActive = dragActiveId === brand.id;

            return (
              <div
                key={brand.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isEditing
                    ? 'border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/30'
                    : 'border-[#7B4B2A]/20 hover:border-[#7B4B2A]/40'
                }`}
              >
                {/* Brand Card Summary Bar */}
                <div
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-[#FAF7F2]/40"
                  onClick={() => setEditingId(isEditing ? null : brand.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Logo Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#7B4B2A]/15 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="font-serif font-bold text-xs text-[#7B4B2A]">
                          {(brand.name || 'BK').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-sm font-bold text-[#2C1810]">
                          {brand.name || 'Sem nome'}
                        </h4>
                        {brand.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Atualmente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5EFE9] text-[#7B4B2A] border border-[#7B4B2A]/20">
                            Já Trabalhou
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7B4B2A] mt-0.5">
                        {brand.category || 'Categoria'} • {brand.campaignType || 'Campanha'}
                      </p>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveBrand(index, 'up')}
                      className="p-1.5 rounded-lg text-[#7B4B2A] hover:bg-[#FAF7F2] disabled:opacity-30 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === displayedBrands.length - 1}
                      onClick={() => handleMoveBrand(index, 'down')}
                      className="p-1.5 rounded-lg text-[#7B4B2A] hover:bg-[#FAF7F2] disabled:opacity-30 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : brand.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#4A2E1F] hover:bg-[#FAF7F2] rounded-lg cursor-pointer"
                    >
                      {isEditing ? 'Fechar' : 'Editar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="p-1.5 rounded-lg text-[#7B4B2A] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Remover marca"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Form Body (Expanded) */}
                {isEditing && (
                  <div className="p-5 border-t border-[#7B4B2A]/10 bg-white space-y-5">
                    {/* Top Row: Name and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                          Nome da Marca *
                        </label>
                        <input
                          type="text"
                          value={brand.name}
                          onChange={(e) => handleUpdateBrand(brand.id, { name: e.target.value })}
                          placeholder="Ex: Salon Line, Principia, Natura..."
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      {/* Status: Active or Past */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                          Status da Parceria *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateBrand(brand.id, { status: 'active' })}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              brand.status === 'active'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs font-bold'
                                : 'bg-[#FAF7F2] border-[#7B4B2A]/20 text-[#7B4B2A] hover:bg-white'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Trabalho Atual (Ativa)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateBrand(brand.id, { status: 'past' })}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              brand.status === 'past'
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#2C1810] shadow-2xs font-bold'
                                : 'bg-[#FAF7F2] border-[#7B4B2A]/20 text-[#7B4B2A] hover:bg-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B8860B]" />
                            <span>Já Trabalhou (Histórico)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Second Row: Category & Quick Suggestions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#7B4B2A]">
                          Categoria / Nicho da Marca *
                        </label>
                        <span className="text-[11px] text-[#7B4B2A]/70">
                          Sugestões rápidas:
                        </span>
                      </div>
                      <input
                        type="text"
                        value={brand.category}
                        onChange={(e) => handleUpdateBrand(brand.id, { category: e.target.value })}
                        placeholder="Ex: Cachos & Capilar, Dermocosméticos, Moda Feminina..."
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {PRESET_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleUpdateBrand(brand.id, { category: cat })}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              brand.category === cat
                                ? 'bg-[#4A2E1F] text-white'
                                : 'bg-[#FAF7F2] text-[#7B4B2A] border border-[#7B4B2A]/15 hover:bg-[#D4AF37]/20 hover:text-[#2C1810]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Third Row: Campaign Type & Suggestions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#7B4B2A]">
                          Formato ou Tipo de Campanha *
                        </label>
                        <span className="text-[11px] text-[#7B4B2A]/70">
                          Sugestões rápidas:
                        </span>
                      </div>
                      <input
                        type="text"
                        value={brand.campaignType}
                        onChange={(e) => handleUpdateBrand(brand.id, { campaignType: e.target.value })}
                        placeholder="Ex: Embaixadora & Rotina Real, Lançamento Linha..."
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {PRESET_CAMPAIGNS.map((camp) => (
                          <button
                            key={camp}
                            type="button"
                            onClick={() => handleUpdateBrand(brand.id, { campaignType: camp })}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              brand.campaignType === camp
                                ? 'bg-[#4A2E1F] text-white'
                                : 'bg-[#FAF7F2] text-[#7B4B2A] border border-[#7B4B2A]/15 hover:bg-[#D4AF37]/20 hover:text-[#2C1810]'
                            }`}
                          >
                            {camp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fourth Row: Brand Website URL */}
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                        Link / Website Oficial da Marca (Opcional)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          value={brand.websiteUrl || ''}
                          onChange={(e) => handleUpdateBrand(brand.id, { websiteUrl: e.target.value })}
                          placeholder="https://www.marca.com.br"
                          className="w-full pl-3 pr-8 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                        {brand.websiteUrl && (
                          <a
                            href={brand.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2.5 text-[#7B4B2A] hover:text-[#B8860B]"
                            title="Abrir link em nova aba"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Fifth Row: Logo Management with Drag-and-Drop & Optimization */}
                    <div className="p-4 bg-[#FAF7F2] border border-[#7B4B2A]/20 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#2C1810] flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#B8860B]" />
                          <span>Logo da Marca (Imagem ou Link)</span>
                        </label>
                        {brand.logoUrl && (
                          <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Logo configurada</span>
                          </span>
                        )}
                      </div>

                      {/* Dropzone & Preview */}
                      <div
                        onDragOver={(e) => handleDragOver(brand.id, e)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(brand.id, e)}
                        className={`flex flex-col sm:flex-row items-center gap-4 p-3 bg-white rounded-xl border-2 transition-all ${
                          isBrandDragActive
                            ? 'border-[#B8860B] bg-[#D4AF37]/10 scale-[1.01]'
                            : 'border-dashed border-[#7B4B2A]/25'
                        }`}
                      >
                        {/* Visual Logo Box */}
                        <div className="w-28 h-20 rounded-xl bg-gradient-to-b from-[#FAF7F2] to-white border border-[#7B4B2A]/15 flex items-center justify-center p-2 shrink-0 shadow-2xs overflow-hidden">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-6 h-6 text-[#7B4B2A]/40 mx-auto mb-1" />
                              <span className="text-[10px] text-[#7B4B2A]/60 block leading-tight">
                                Sem Logo
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="space-y-2 flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="file"
                              accept=".svg,.png,.jpg,.jpeg,.webp,image/*"
                              className="hidden"
                              ref={(el) => (fileInputRefs.current[brand.id] = el)}
                              onChange={(e) => handleFileUpload(brand.id, e)}
                            />

                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[brand.id]?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] bg-[#4A2E1F] hover:bg-[#7B4B2A] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Selecionar Imagem (PNG, JPG, WEBP, SVG)</span>
                            </button>

                            {brand.logoUrl && (
                              <button
                                type="button"
                                onClick={() => handleUpdateBrand(brand.id, { logoUrl: '' })}
                                className="px-3 py-1.5 text-xs text-[#7B4B2A] hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-[#7B4B2A]/15"
                              >
                                Limpar Logo
                              </button>
                            )}
                          </div>

                          {/* Direct URL input fallback */}
                          <div className="flex items-center gap-2 pt-1">
                            <LinkIcon className="w-3.5 h-3.5 text-[#7B4B2A] shrink-0" />
                            <input
                              type="text"
                              value={brand.logoUrl}
                              onChange={(e) => handleUpdateBrand(brand.id, { logoUrl: e.target.value })}
                              placeholder="Ou cole aqui o link direto da logo (URL HTTPS ou Data URL)"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>

                          {/* Upload Feedback Messages */}
                          {uploadSuccess?.id === brand.id && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Imagem otimizada com sucesso ({uploadSuccess.sizeKb} KB) pronta para salvar!</span>
                            </div>
                          )}

                          {uploadError?.id === brand.id && (
                            <div className="flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-200">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>{uploadError.message}</span>
                            </div>
                          )}

                          <div className="text-[11px] text-[#7B4B2A]/80 leading-tight">
                            Dica: Você também pode arrastar e soltar um arquivo de logo diretamente sobre a caixa acima.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom action inside editing card */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-[#7B4B2A]">
                        Não se esqueça de salvar na nuvem para aplicar as mudanças no Mídia Kit público.
                      </span>
                      <div className="flex items-center gap-2">
                        {onSaveDirect && (
                          <button
                            type="button"
                            onClick={() => onSaveDirect()}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{saving ? 'Gravando...' : 'Salvar Alterações'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 text-xs font-semibold text-[#FAF7F2] bg-[#4A2E1F] hover:bg-[#7B4B2A] rounded-xl transition-colors cursor-pointer"
                        >
                          Concluir Edição
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Save Bar */}
      {brands.length > 0 && onSaveDirect && (
        <div className="mt-8 p-4 bg-white border border-[#D4AF37]/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-[#2C1810]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold">
              Alterou textos ou logos de marcas?
            </span>
            <span className="text-[#7B4B2A] hidden sm:inline">
              Grave instantaneamente todas as alterações no banco de dados.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSaveDirect()}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando na Nuvem...' : 'Salvar Todas as Marcas na Nuvem'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
