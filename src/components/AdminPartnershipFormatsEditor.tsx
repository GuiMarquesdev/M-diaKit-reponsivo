import React, { useState } from 'react';
import { PartnershipFormat } from '../types';
import {
  Plus,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Layers,
  Edit3,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';

interface AdminPartnershipFormatsEditorProps {
  formats: PartnershipFormat[];
  onChange: (formats: PartnershipFormat[]) => void;
}

const PRESET_FORMATS: { name: string; description: string; badge: string }[] = [
  {
    name: 'Combo Reels + Stories (Instagram)',
    description: '1 Reels no feed em collab + sequência de 3 a 5 Stories com links diretos e stickers de engajamento.',
    badge: 'Mais Pedido',
  },
  {
    name: 'Vídeo Dedicado no TikTok',
    description: '1 Vídeo nativo de alta retenção no TikTok com estética cinematográfica, rotina real e narrativa envolvente.',
    badge: 'Alto Alcance',
  },
  {
    name: 'Embaixadorismo / Contrato Mensal',
    description: 'Parceria contínua de 3 a 6 meses com entregas mensais recorrentes no Instagram & TikTok, menções orgânicas e uso de imagem.',
    badge: 'Contrato Longo',
  },
  {
    name: 'Presença VIP em Evento / Workshop',
    description: 'Presença confirmada no evento físico da marca com cobertura completa em tempo real nos Stories e menção no feed.',
    badge: 'Presencial',
  },
  {
    name: 'Live Shopping / Co-host de Transmissão',
    description: 'Participação ao vivo com demonstração prática de produtos, prova em tempo real e cupons especiais.',
    badge: 'Conversão',
  },
  {
    name: 'Série de Stories com Cupom Exclusivo',
    description: 'Sequência dinâmica de 5 Stories mostrando aplicação real, textura, benefícios e link com cupom rastreável.',
    badge: 'Performance',
  },
];

export const AdminPartnershipFormatsEditor: React.FC<AdminPartnershipFormatsEditorProps> = ({
  formats = [],
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Format Draft State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBadge, setNewBadge] = useState('Mais Pedido');

  const handleAddFormat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim()) return;

    const newFormat: PartnershipFormat = {
      id: `format-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newName.trim(),
      description: newDescription.trim(),
      badge: newBadge.trim() || undefined,
      active: true,
    };

    onChange([...formats, newFormat]);
    setNewName('');
    setNewDescription('');
    setNewBadge('');
    setIsAddingNew(false);
  };

  const handleApplyPreset = (preset: { name: string; description: string; badge: string }) => {
    const newFormat: PartnershipFormat = {
      id: `format-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: preset.name,
      description: preset.description,
      badge: preset.badge,
      active: true,
    };
    onChange([...formats, newFormat]);
  };

  const handleUpdateFormat = (id: string, updates: Partial<PartnershipFormat>) => {
    const updated = formats.map((item) => (item.id === id ? { ...item, ...updates } : item));
    onChange(updated);
  };

  const handleDeleteFormat = (id: string) => {
    const target = formats.find((f) => f.id === id);
    if (!target) return;
    if (window.confirm(`Deseja remover o formato "${target.name}"?`)) {
      onChange(formats.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formats.length) return;

    const list = [...formats];
    const [movedItem] = list.splice(index, 1);
    list.splice(newIndex, 0, movedItem);
    onChange(list);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#7B4B2A]/15 pb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2C1810] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#B8860B]" />
            <span>Formatos de Parceria Comercial</span>
          </h3>
          <p className="text-xs text-[#7B4B2A] mt-0.5">
            Gerencie as opções exibidas no seletor de propostas do Mídia Kit quando uma marca ou agência solicita parceria.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddingNew((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isAddingNew ? 'Fechar Formulário' : 'Novo Formato'}</span>
          </button>
        </div>
      </div>

      {/* Form to Add New Format */}
      {isAddingNew && (
        <form
          onSubmit={handleAddFormat}
          className="p-5 bg-[#FAF7F2] border border-[#D4AF37]/50 rounded-2xl space-y-4 animate-fadeIn shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#7B4B2A]/10 pb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-[#4A2E1F] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
              Cadastrar Novo Formato de Parceria
            </span>
            <span className="text-[11px] text-[#7B4B2A]">Aparecerá automaticamente no formulário de contato</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                Nome do Formato <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Combo Reels + Stories (Instagram)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
                Selo / Badge (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Mais Pedido, Exclusivo"
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">
              Descrição & Entregas Estimadas
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o que está incluso neste formato comercial..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#7B4B2A]/10">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 text-xs text-[#7B4B2A] hover:bg-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
              Salvar Formato
            </button>
          </div>
        </form>
      )}

      {/* Preset Quick Add Suggestions */}
      <div className="p-4 bg-white border border-[#7B4B2A]/15 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B4B2A] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#B8860B]" />
            Sugestões Rápidas de Mercado (Clique para adicionar)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_FORMATS.map((preset, idx) => {
            const alreadyExists = formats.some(
              (f) => f.name.toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={idx}
                type="button"
                disabled={alreadyExists}
                onClick={() => handleApplyPreset(preset)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                  alreadyExists
                    ? 'bg-[#F5EFE9] border-[#7B4B2A]/10 text-[#7B4B2A]/50 cursor-not-allowed'
                    : 'bg-[#FAF7F2] hover:bg-[#F5EFE9] border-[#D4AF37]/40 text-[#4A2E1F] hover:border-[#D4AF37] cursor-pointer shadow-2xs'
                }`}
              >
                <Plus className="w-3 h-3 text-[#B8860B]" />
                <span>{preset.name}</span>
                {alreadyExists && <span className="text-[10px] text-emerald-700">(Adicionado)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Formats List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#7B4B2A]">
          <span>Formatos Cadastrados ({formats.length})</span>
          <span className="text-[11px] text-[#7B4B2A]/70">Use as setas para alterar a ordem no seletor</span>
        </div>

        {formats.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF7F2] border border-dashed border-[#7B4B2A]/30 rounded-2xl space-y-2">
            <Layers className="w-8 h-8 text-[#B8860B] mx-auto opacity-70" />
            <p className="text-xs text-[#7B4B2A] font-medium">Nenhum formato de parceria cadastrado.</p>
            <p className="text-[11px] text-[#7B4B2A]/70">Clique em "Novo Formato" ou escolha uma das sugestões acima.</p>
          </div>
        ) : (
          formats.map((format, index) => {
            const isEditing = editingId === format.id;

            return (
              <div
                key={format.id}
                className={`p-4 rounded-2xl border transition-all ${
                  format.active === false
                    ? 'bg-[#F9F7F5] border-[#7B4B2A]/15 opacity-70'
                    : 'bg-white border-[#7B4B2A]/20 hover:border-[#D4AF37]/60 shadow-2xs'
                }`}
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#7B4B2A] mb-1">
                          Nome do Formato
                        </label>
                        <input
                          type="text"
                          value={format.name}
                          onChange={(e) => handleUpdateFormat(format.id, { name: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#7B4B2A] mb-1">
                          Badge / Selo
                        </label>
                        <input
                          type="text"
                          value={format.badge || ''}
                          onChange={(e) => handleUpdateFormat(format.id, { badge: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#7B4B2A] mb-1">
                        Descrição das Entregas
                      </label>
                      <textarea
                        rows={2}
                        value={format.description || ''}
                        onChange={(e) => handleUpdateFormat(format.id, { description: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#7B4B2A]/10">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-[#4A2E1F] text-[#FAF7F2] text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-[#D4AF37]" />
                        Concluir Edição
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#2C1810]">{format.name}</span>
                        {format.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/50 text-[#B8860B] font-semibold">
                            {format.badge}
                          </span>
                        )}
                        {format.active === false && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            Oculto no seletor
                          </span>
                        )}
                      </div>
                      {format.description && (
                        <p className="text-[11px] text-[#7B4B2A] leading-relaxed line-clamp-2">
                          {format.description}
                        </p>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[#7B4B2A]/10 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Toggle Active Status */}
                      <button
                        type="button"
                        title={format.active === false ? 'Ativar no seletor' : 'Ocultar do seletor'}
                        onClick={() =>
                          handleUpdateFormat(format.id, { active: format.active === false ? true : false })
                        }
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          format.active === false
                            ? 'text-gray-400 hover:text-gray-700 bg-gray-50'
                            : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50'
                        }`}
                      >
                        {format.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Reorder Buttons */}
                      <div className="flex items-center bg-[#FAF7F2] border border-[#7B4B2A]/15 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1.5 hover:bg-[#F5EFE9] text-[#7B4B2A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === formats.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1.5 hover:bg-[#F5EFE9] text-[#7B4B2A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingId(format.id)}
                        className="p-1.5 text-[#7B4B2A] hover:text-[#4A2E1F] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
                        title="Editar formato"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFormat(format.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover formato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
