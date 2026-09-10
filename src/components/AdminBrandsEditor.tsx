import React, { useState, useRef } from 'react';
import { BrandPartner } from '../types';
import {
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';

interface AdminBrandsEditorProps {
  brands: BrandPartner[];
  onChange: (brands: BrandPartner[]) => void;
}

// Compress and convert file preserving transparency strictly for PNG or SVG
const readLogoFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    if (!isSvg && !isPng) {
      reject(new Error('Formato não suportado. Apenas SVG e PNG são permitidos.'));
      return;
    }

    const reader = new FileReader();

    if (isSvg) {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // PNG with transparent background preservation
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 600; // Logos maintain high crispness while remaining lightweight
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Clean transparent canvas before drawing
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Always output PNG to preserve alpha transparency
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const AdminBrandsEditor: React.FC<AdminBrandsEditorProps> = ({
  brands = [],
  onChange,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'past'>('all');
  const [editingId, setEditingId] = useState<string | null>(brands[0]?.id || null);
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

  const handleFileUpload = async (brandId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation: SVG or PNG only
    const fileName = file.name.toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || fileName.endsWith('.svg');
    const isPng = file.type === 'image/png' || fileName.endsWith('.png');

    if (!isSvg && !isPng) {
      alert('Formato inválido! O upload direto de logos é permitido exclusivamente nos formatos SVG (.svg) e PNG (.png).');
      e.target.value = '';
      return;
    }

    try {
      const dataUrl = await readLogoFile(file);
      handleUpdateBrand(brandId, { logoUrl: dataUrl });
      e.target.value = '';
    } catch (err: any) {
      console.error('Erro ao carregar arquivo de logo:', err);
      alert(err?.message || 'Falha ao processar o arquivo de imagem.');
      e.target.value = '';
    }
  };

  const displayedBrands = brands.filter((b) => {
    if (filterTab === 'active') return b.status === 'active';
    if (filterTab === 'past') return b.status === 'past';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tab Header */}
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
            Cadastre as marcas que você trabalha atualmente e o histórico de campanhas que já realizou.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
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
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
          <CheckCircle2 className="w-3.5 h-3.5 text-[#B8860B]" />
          <span>Já Trabalhou ({brands.filter((b) => b.status === 'past').length})</span>
        </button>
      </div>

      {/* Brands List */}
      {displayedBrands.length === 0 ? (
        <div className="bg-white border border-[#7B4B2A]/15 rounded-2xl p-8 text-center space-y-3">
          <Briefcase className="w-8 h-8 text-[#B8860B] mx-auto" />
          <p className="font-serif text-base text-[#4A2E1F]">Nenhuma marca nesta categoria.</p>
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
                          {brand.name.slice(0, 2).toUpperCase()}
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
                          placeholder="Ex: Salon Line, Principia..."
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      {/* Status: Active or Past */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                          Status da Parceria *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
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
                                ? 'bg-[#F5EFE9] border-[#D4AF37] text-[#4A2E1F] shadow-2xs font-bold'
                                : 'bg-[#FAF7F2] border-[#7B4B2A]/20 text-[#7B4B2A] hover:bg-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B8860B]" />
                            <span>Já Trabalhou (Histórico)</span>
                          </button>
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                          Categoria / Nicho
                        </label>
                        <input
                          type="text"
                          value={brand.category || ''}
                          onChange={(e) => handleUpdateBrand(brand.id, { category: e.target.value })}
                          placeholder="Ex: Cabelos & Cachos, Dermocosméticos, Moda..."
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      {/* Campaign Type / Details */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                          Tipo de Campanha / Papel
                        </label>
                        <input
                          type="text"
                          value={brand.campaignType || ''}
                          onChange={(e) => handleUpdateBrand(brand.id, { campaignType: e.target.value })}
                          placeholder="Ex: Embaixadora Oficial, Reels + Stories, Presença VIP..."
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      {/* Website URL */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                          Link da Marca ou Campanha (Opcional)
                        </label>
                        <input
                          type="url"
                          value={brand.websiteUrl || ''}
                          onChange={(e) => handleUpdateBrand(brand.id, { websiteUrl: e.target.value })}
                          placeholder="https://marca.com.br"
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Logo Upload / URL Section */}
                    <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#7B4B2A]/15 space-y-3">
                      <label className="block text-xs font-semibold text-[#2C1810]">
                        Imagem da Logo da Marca
                      </label>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Logo Preview Box */}
                        <div className="w-24 h-24 rounded-xl bg-white border border-[#7B4B2A]/20 flex items-center justify-center p-2 shrink-0 shadow-xs relative group overflow-hidden">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-6 h-6 text-[#7B4B2A]/40 mx-auto mb-1" />
                              <span className="text-[10px] text-[#7B4B2A]/60">Sem logo</span>
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="space-y-2 flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="file"
                              accept=".svg,.png,image/svg+xml,image/png"
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
                              <span>Upload Logo (SVG ou PNG)</span>
                            </button>

                            {brand.logoUrl && (
                              <button
                                type="button"
                                onClick={() => handleUpdateBrand(brand.id, { logoUrl: '' })}
                                className="px-3 py-1.5 text-xs text-[#7B4B2A] hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-[#7B4B2A]/15"
                              >
                                Limpar
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <LinkIcon className="w-3.5 h-3.5 text-[#7B4B2A] shrink-0" />
                            <input
                              type="text"
                              value={brand.logoUrl}
                              onChange={(e) => handleUpdateBrand(brand.id, { logoUrl: e.target.value })}
                              placeholder="Ou cole o link direto da logo (URL / HTTPS / Data URL)"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#7B4B2A]/20 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#7B4B2A]">
                            <span className="font-bold text-[#2C1810] bg-[#D4AF37]/25 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                              Apenas SVG e PNG
                            </span>
                            <span>Upload exclusivo para arquivos com fundo transparente (.svg ou .png).</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 text-xs font-semibold text-[#FAF7F2] bg-[#4A2E1F] hover:bg-[#7B4B2A] rounded-xl transition-colors cursor-pointer"
                      >
                        Concluir Edição
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
