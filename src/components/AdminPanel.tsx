import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Upload,
  User,
  TrendingUp,
  Instagram,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Shield,
  Briefcase,
  Lock,
  Mail,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Zap,
} from 'lucide-react';
import { MediaKitData, SegmentItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { autoAdequateAllMediaKitImages, calculatePayloadSizeKb } from '../utils/imageOptimizer';
import { ImageUploadField } from './ImageUploadField';
import { AdminBrandsEditor } from './AdminBrandsEditor';
import { AdminPartnershipFormatsEditor } from './AdminPartnershipFormatsEditor';
import { AdminInstagramEditor } from './AdminInstagramEditor';
import { AdminTikTokEditor } from './AdminTikTokEditor';
import { OFFICIAL_SOCIAL_LINKS } from '../constants';
import { TikTokIcon } from './SocialIcons';

interface AdminPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  data: MediaKitData;
  onSave: (newData: MediaKitData) => Promise<boolean>;
  onReset: () => Promise<boolean>;
  saving: boolean;
  isPage?: boolean;
}

type TabType = 'creator' | 'metrics' | 'instagram' | 'tiktok' | 'segments' | 'photos' | 'brands' | 'formats' | 'contact';

interface TabItem {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const TABS: TabItem[] = [
  { id: 'creator', label: 'Perfil & Bio', shortLabel: 'Perfil', icon: User, description: 'Nome, bio e apresentação' },
  { id: 'photos', label: 'Gerenciador de Fotos', shortLabel: 'Fotos', icon: ImageIcon, description: 'Upload e enquadramento de fotos' },
  { id: 'metrics', label: 'Métricas Globais', shortLabel: 'Métricas', icon: TrendingUp, description: 'Alcance, engajamento e impressões' },
  { id: 'instagram', label: 'Instagram & Demografia', shortLabel: 'Instagram', icon: Instagram, description: 'Seguidores, demografia e reels' },
  { id: 'tiktok', label: 'TikTok & Viral', shortLabel: 'TikTok', icon: TrendingUp, description: 'Curtidas, views e recordes' },
  { id: 'segments', label: 'Pilares Editoriais', shortLabel: 'Pilares', icon: FileText, description: 'Nichos e categorias de conteúdo' },
  { id: 'brands', label: 'Marcas & Parcerias', shortLabel: 'Marcas', icon: Briefcase, description: 'Marcas atuais e histórico' },
  { id: 'formats', label: 'Formatos de Parceria', shortLabel: 'Formatos', icon: Layers, description: 'Entregas e formatos comerciais' },
  { id: 'contact', label: 'Contato Comercial', shortLabel: 'Contato', icon: Mail, description: 'Email, WhatsApp e assessoria' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen = true,
  onClose,
  data,
  onSave,
  onReset,
  saving,
  isPage = false,
}) => {
  const { user, loginWithGoogle, loginWithEmail, logout } = useAuth();
  const [formData, setFormData] = useState<MediaKitData>(data);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('creator');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoAdequating, setIsAutoAdequating] = useState(false);
  const [autoAdequateMessage, setAutoAdequateMessage] = useState<string | null>(null);

  // Auth form states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sync state when data props change, avoiding clobbering in-flight user edits
  React.useEffect(() => {
    if (!isDirty) {
      setFormData(data);
    }
  }, [data, isDirty]);

  // Mobile tabs horizontal scroll reference & active tab helpers
  const mobileTabsRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));
  const activeTabItem = TABS[activeIndex] || TABS[0];
  const ActiveIcon = activeTabItem.icon;

  // Auto-scroll active mobile tab chip into view
  useEffect(() => {
    if (mobileTabsRef.current) {
      const activeEl = mobileTabsRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await loginWithEmail(emailInput, passwordInput);
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Erro na autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao entrar com Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAutoAdequateAll = async () => {
    setIsAutoAdequating(true);
    setAutoAdequateMessage(null);
    setErrorMessage(null);
    try {
      const beforeKb = calculatePayloadSizeKb(formData);
      const { updatedData, savedKb } = await autoAdequateAllMediaKitImages(formData);
      setFormData(updatedData);
      setIsDirty(true);
      const afterKb = calculatePayloadSizeKb(updatedData);
      if (savedKb > 0) {
        setAutoAdequateMessage(`Imagens adequadas com sucesso! Redução de ${beforeKb} KB para ${afterKb} KB (${savedKb} KB economizados).`);
      } else {
        setAutoAdequateMessage(`Todas as imagens já estão 100% compactas e otimizadas (${afterKb} KB).`);
      }
      setTimeout(() => setAutoAdequateMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro na auto-adequação:', err);
      setErrorMessage('Não foi possível auto-adequar as imagens automaticamente.');
    } finally {
      setIsAutoAdequating(false);
    }
  };

  // Ferramenta temporária de migração: puxa o conteúdo que ainda está salvo
  // no Firestore (sistema antigo) e grava no Supabase através do mesmo
  // caminho de salvamento já usado pelo painel. Pode ser removida depois
  // que a migração for confirmada.
  const [isMigrating, setIsMigrating] = useState(false);
  const handleMigrateFromFirestore = async () => {
    if (!confirm('Isso vai importar o conteúdo salvo no Firestore (sistema antigo) e SOBRESCREVER os dados atuais do Supabase. Confirmar?')) {
      return;
    }
    setIsMigrating(true);
    setErrorMessage(null);
    try {
      const [{ doc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebase'),
      ]);
      const snap = await getDoc(doc(db, 'content', 'mediaKit'));
      if (!snap.exists()) {
        alert('Nenhum dado encontrado no Firestore para importar.');
        return;
      }
      const legacyData = snap.data() as MediaKitData;
      const success = await onSave(legacyData);
      alert(success ? 'Dados importados do Firestore e salvos no Supabase com sucesso!' : 'Falha ao salvar os dados importados no Supabase.');
    } catch (err: any) {
      console.error('Erro ao importar do Firestore:', err);
      alert('Erro ao importar do Firestore: ' + (err?.message || err));
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);
    let success = await onSave(formData);
    if (!success) {
      // Auto-remediation: attempt automatic adequacy pass on formData and retry
      console.log('[Auto-Remediation] Tentando auto-adequar imagens para salvar sem erros...');
      try {
        const { updatedData } = await autoAdequateAllMediaKitImages(formData);
        setFormData(updatedData);
        success = await onSave(updatedData);
        if (success) {
          setIsDirty(false);
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3500);
          return;
        }
      } catch (e) {
        console.error('Erro no retry de auto-adequação:', e);
      }
      setErrorMessage(
        'Falha ao salvar no banco de dados. Verifique a conexão com a internet ou utilize o botão "Auto-Adequar Imagens".'
      );
    } else {
      setIsDirty(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const handleSegmentChange = (index: number, field: keyof SegmentItem, value: string) => {
    const updated = [...formData.segments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, segments: updated });
  };

  const handleAddSegment = () => {
    const newSeg: SegmentItem = {
      id: `seg-${Date.now()}`,
      tag: `0${formData.segments.length + 1} / NOVO`,
      title: 'Novo Pilar Editorial',
      description: 'Descrição do novo segmento e formato de conteúdo.',
    };
    setFormData({ ...formData, segments: [...formData.segments, newSeg] });
  };

  const handleRemoveSegment = (index: number) => {
    const updated = formData.segments.filter((_, i) => i !== index);
    setFormData({ ...formData, segments: updated });
  };

  return (
    <div
      className={
        isPage
          ? 'min-h-screen bg-[#F5EFE9] text-[#2C1810] flex flex-col p-2 sm:p-5 md:p-8'
          : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fadeIn'
      }
    >
      <div
        className={
          isPage
            ? 'bg-[#FAF7F2] border border-[#D4AF37]/50 rounded-2xl sm:rounded-3xl w-full max-w-6xl mx-auto shadow-xl flex flex-col flex-1 overflow-hidden text-[#2C1810] min-h-[88vh]'
            : 'bg-[#FAF7F2] border border-[#D4AF37]/50 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-[#2C1810]'
        }
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#7B4B2A]/15 bg-[#F5EFE9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#2C1810] tracking-tight">
                Painel Administrativo do Mídia Kit
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#2C1810] shrink-0 border border-[#D4AF37]/40">
                <Shield className="w-3 h-3 text-[#B8860B]" /> Área Restrita
              </span>
            </div>
            <p className="text-xs text-[#7B4B2A] truncate">
              {user ? `Conectado como: ${user.email || 'Admin'}` : 'Acesso restrito para edição'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Quick Link Instagram */}
            <a
              href={formData.instagram.profileUrl || OFFICIAL_SOCIAL_LINKS.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#4A2E1F] bg-white hover:bg-[#FAF7F2] border border-[#7B4B2A]/20 hover:border-[#D4AF37] rounded-xl transition-all shadow-2xs cursor-pointer group"
              title="Abrir perfil oficial no Instagram"
            >
              <Instagram className="w-3.5 h-3.5 text-[#B8860B] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Instagram</span>
              <ExternalLink className="w-3 h-3 text-[#7B4B2A]/50 group-hover:text-[#B8860B]" />
            </a>

            {/* Quick Link TikTok */}
            <a
              href={formData.tiktok.profileUrl || OFFICIAL_SOCIAL_LINKS.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#4A2E1F] bg-white hover:bg-[#FAF7F2] border border-[#7B4B2A]/20 hover:border-[#D4AF37] rounded-xl transition-all shadow-2xs cursor-pointer group"
              title="Abrir perfil oficial no TikTok"
            >
              <TikTokIcon className="w-3.5 h-3.5 text-[#B8860B] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">TikTok</span>
              <ExternalLink className="w-3 h-3 text-[#7B4B2A]/50 group-hover:text-[#B8860B]" />
            </a>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4A2E1F] bg-white hover:bg-[#FAF7F2] border border-[#7B4B2A]/20 hover:border-[#D4AF37] rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Voltar ao Mídia Kit Público"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Voltar ao Mídia Kit</span>
              </button>
            )}

            {user && (
              <button
                type="button"
                onClick={handleMigrateFromFirestore}
                disabled={isMigrating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4A2E1F] bg-white hover:bg-[#FAF7F2] border border-[#D4AF37]/50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                title="Importar dados antigos salvos no Firestore para o Supabase (usar uma única vez na migração)"
              >
                <Cloud className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>{isMigrating ? 'Importando...' : 'Importar do Firestore'}</span>
              </button>
            )}

            {user && (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7B4B2A] hover:text-[#C53030] bg-white sm:bg-transparent hover:bg-red-50 sm:hover:bg-white/60 border border-[#7B4B2A]/15 sm:border-transparent rounded-xl transition-colors cursor-pointer"
                title="Desconectar"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}

            {!isPage && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#2C1810]/10 text-[#2C1810] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* If user is NOT logged in: Show Login Screen */}
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            {
              /* Standard Login Screen — senha validada pelo Supabase Auth no servidor */
              <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#D4AF37]/30 shadow-md space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-xs uppercase tracking-widest text-[#B8860B] font-semibold">
                    Acesso Administrativo Oficial
                  </span>
                  <h3 className="font-serif text-2xl text-[#2C1810]">
                    Painel da Sophia Menezes
                  </h3>
                  <p className="text-xs text-[#7B4B2A]">
                    Gerencie métricas do Instagram & TikTok, biografia, fotos e propostas comerciais.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">E-mail</label>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Senha</label>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-[#4A2E1F] hover:bg-[#2C1810] text-[#FAF7F2] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {authLoading ? 'Entrando...' : 'Entrar no Painel Admin'}
                  </button>
                </form>

                <div className="flex items-center gap-3 text-xs text-[#7B4B2A]/40 pt-1">
                  <span className="h-[1px] flex-1 bg-[#7B4B2A]/15" />
                  <span>ou autenticar com</span>
                  <span className="h-[1px] flex-1 bg-[#7B4B2A]/15" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#F5EFE9] border border-[#7B4B2A]/20 hover:border-[#D4AF37] rounded-xl text-xs font-semibold text-[#2C1810] flex items-center justify-center gap-3 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com Conta Google</span>
                </button>

                {onClose && (
                  <div className="pt-2 text-center border-t border-[#7B4B2A]/10">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs text-[#7B4B2A] hover:text-[#2C1810] inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Voltar para o Mídia Kit Público</span>
                    </button>
                  </div>
                )}
              </div>
            }
          </div>
        ) : (
          /* Logged In: Full CMS Admin Interface */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            
            {/* Navigation: Responsive Switcher for Mobile (< md) */}
            <div className="md:hidden bg-[#F5EFE9] border-b border-[#7B4B2A]/15 p-2.5 flex flex-col gap-2 shrink-0">
              {/* Header row with Section Counter & Prev/Next buttons */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#7B4B2A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
                  Seção {activeIndex + 1} de {TABS.length}: <span className="text-[#2C1810]">{activeTabItem.shortLabel}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveTab(TABS[activeIndex - 1].id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] border border-[#7B4B2A]/20 rounded-lg text-xs font-semibold text-[#4A2E1F] disabled:opacity-30 cursor-pointer shadow-2xs transition-all"
                    title="Seção anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex === TABS.length - 1}
                    onClick={() => setActiveTab(TABS[activeIndex + 1].id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] border border-[#7B4B2A]/20 rounded-lg text-xs font-semibold text-[#4A2E1F] disabled:opacity-30 cursor-pointer shadow-2xs transition-all"
                    title="Próxima seção"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Native Dropdown for 1-tap jump on mobile */}
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as TabType)}
                  className="w-full appearance-none bg-white border border-[#D4AF37]/60 text-[#2C1810] font-bold text-xs py-2 pl-9 pr-8 rounded-xl shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                >
                  {TABS.map((tab, idx) => (
                    <option key={tab.id} value={tab.id}>
                      {idx + 1}. {tab.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#B8860B]">
                  <ActiveIcon className="w-4 h-4" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7B4B2A]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Horizontal Scrollable Pills Strip */}
              <div
                ref={mobileTabsRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth"
              >
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-tab-id={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#4A2E1F] text-[#FAF7F2] shadow-sm ring-1 ring-[#D4AF37]/60'
                          : 'bg-white/80 text-[#7B4B2A] border border-[#7B4B2A]/15 hover:bg-white'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Quick Social Links Bar */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#7B4B2A]/10 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#7B4B2A]/80 tracking-wider">Perfis Oficiais:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={formData.instagram.profileUrl || OFFICIAL_SOCIAL_LINKS.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#4A2E1F] hover:text-[#B8860B] border border-[#7B4B2A]/15 text-[11px] font-semibold transition-colors shadow-2xs"
                    title="Abrir Instagram"
                  >
                    <Instagram className="w-3 h-3 text-[#B8860B]" />
                    <span>Instagram</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#7B4B2A]/60" />
                  </a>
                  <a
                    href={formData.tiktok.profileUrl || OFFICIAL_SOCIAL_LINKS.tiktok.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#4A2E1F] hover:text-[#B8860B] border border-[#7B4B2A]/15 text-[11px] font-semibold transition-colors shadow-2xs"
                    title="Abrir TikTok"
                  >
                    <TikTokIcon className="w-3 h-3 text-[#B8860B]" />
                    <span>TikTok</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#7B4B2A]/60" />
                  </a>
                </div>
              </div>
            </div>

            {/* Desktop Sidebar Navigation (>= md) */}
            <div className="hidden md:flex md:flex-col w-56 lg:w-60 bg-[#F5EFE9] border-r border-[#7B4B2A]/15 p-3 gap-1.5 shrink-0 overflow-y-auto">
              <div className="pb-2 mb-1 border-b border-[#7B4B2A]/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4B2A] px-2">
                  Seções do Mídia Kit ({TABS.length})
                </span>
              </div>
              <div className="space-y-1">
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#4A2E1F] text-[#FAF7F2] shadow-sm ring-1 ring-[#D4AF37]/40 font-bold'
                          : 'text-[#7B4B2A] hover:bg-[#FAF7F2] hover:text-[#2C1810]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-[#7B4B2A]'}`} />
                        <span className="truncate">{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Perfis Oficiais Quick Access Section */}
              <div className="mt-auto pt-3 border-t border-[#7B4B2A]/15 space-y-1.5">
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4B2A]">
                    Links Oficiais
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Ativo" />
                </div>

                <a
                  href={formData.instagram.profileUrl || OFFICIAL_SOCIAL_LINKS.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#4A2E1F] bg-white/70 hover:bg-white hover:text-[#B8860B] border border-[#7B4B2A]/10 hover:border-[#D4AF37]/50 transition-all shadow-2xs group"
                  title="Abrir perfil oficial do Instagram em nova aba"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Instagram className="w-3.5 h-3.5 text-[#B8860B] shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{formData.instagram.handle || OFFICIAL_SOCIAL_LINKS.instagram.handle}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#7B4B2A]/50 group-hover:text-[#B8860B] shrink-0" />
                </a>

                <a
                  href={formData.tiktok.profileUrl || OFFICIAL_SOCIAL_LINKS.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#4A2E1F] bg-white/70 hover:bg-white hover:text-[#B8860B] border border-[#7B4B2A]/10 hover:border-[#D4AF37]/50 transition-all shadow-2xs group"
                  title="Abrir perfil oficial do TikTok em nova aba"
                >
                  <span className="flex items-center gap-2 truncate">
                    <TikTokIcon className="w-3.5 h-3.5 text-[#B8860B] shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{formData.tiktok.handle || OFFICIAL_SOCIAL_LINKS.tiktok.handle}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#7B4B2A]/50 group-hover:text-[#B8860B] shrink-0" />
                </a>
              </div>
            </div>

            {/* Form Fields Body */}
            <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-6 min-w-0">
              
              {/* Tab 1: Creator / Profile */}
              {activeTab === 'creator' && (
                <div className="space-y-4 max-w-2xl">
                  <h3 className="font-serif text-lg font-bold text-[#2C1810] border-b border-[#7B4B2A]/15 pb-2">
                    Informações Pessoais & Apresentação
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Nome da Criadora</label>
                      <input
                        type="text"
                        value={formData.creator.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creator: { ...formData.creator, name: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Localização</label>
                      <input
                        type="text"
                        value={formData.creator.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creator: { ...formData.creator, location: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Título Principal / Manchete</label>
                    <input
                      type="text"
                      value={formData.creator.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Subtítulo Hero</label>
                    <textarea
                      rows={2}
                      value={formData.creator.subtitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, subtitle: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Citação / Slogan de Destaque</label>
                    <input
                      type="text"
                      value={formData.creator.quote}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, quote: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Biografia (Parágrafo 1)</label>
                      <textarea
                        rows={3}
                        value={formData.creator.bioParagraph1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creator: { ...formData.creator, bioParagraph1: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Biografia (Parágrafo 2)</label>
                      <textarea
                        rows={3}
                        value={formData.creator.bioParagraph2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creator: { ...formData.creator, bioParagraph2: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Photos Manager */}
              {activeTab === 'photos' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="border-b border-[#7B4B2A]/15 pb-2">
                    <h3 className="font-serif text-lg font-bold text-[#2C1810]">
                      Gerenciador de Imagens & Fotografias
                    </h3>
                    <p className="text-xs text-[#7B4B2A]">
                      Faça o upload direto de fotos do seu computador/celular ou cole um link de imagem. As fotos são automaticamente otimizadas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hero Photo */}
                    <ImageUploadField
                      id="hero-photo-upload"
                      label="Foto Principal (Capa / Hero)"
                      description="Foto vertical de destaque na abertura do Mídia Kit."
                      value={formData.creator.heroPhoto}
                      position={formData.creator.heroPhotoPosition || '50% 15%'}
                      aspectRatio="portrait"
                      onChange={(newImg) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, heroPhoto: newImg },
                        })
                      }
                      onPositionChange={(newPos) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, heroPhotoPosition: newPos },
                        })
                      }
                    />

                    {/* About Section Photo */}
                    <ImageUploadField
                      id="about-photo-upload"
                      label="Foto da Seção Sobre / Apresentação"
                      description="Retrato horizontal/editorial que acompanha sua biografia."
                      value={formData.creator.aboutPhoto}
                      position={formData.creator.aboutPhotoPosition || '50% 50%'}
                      aspectRatio="landscape"
                      onChange={(newImg) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, aboutPhoto: newImg },
                        })
                      }
                      onPositionChange={(newPos) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, aboutPhotoPosition: newPos },
                        })
                      }
                    />

                    {/* Closing Photo */}
                    <ImageUploadField
                      id="closing-photo-upload"
                      label="Foto do Card de Contato Final"
                      description="Foto que fica no card elegante de encerramento."
                      value={formData.creator.closingPhoto}
                      position={formData.creator.closingPhotoPosition || '50% 50%'}
                      aspectRatio="square"
                      onChange={(newImg) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, closingPhoto: newImg },
                        })
                      }
                      onPositionChange={(newPos) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, closingPhotoPosition: newPos },
                        })
                      }
                    />

                    {/* Avatar / Profile */}
                    <ImageUploadField
                      id="profile-photo-upload"
                      label="Avatar / Foto de Perfil"
                      description="Foto circular do cabeçalho e identificação rápida."
                      value={formData.creator.profilePhoto}
                      position={formData.creator.profilePhotoPosition || '50% 50%'}
                      aspectRatio="circle"
                      maxDimension={600}
                      onChange={(newImg) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, profilePhoto: newImg },
                        })
                      }
                      onPositionChange={(newPos) =>
                        setFormData({
                          ...formData,
                          creator: { ...formData.creator, profilePhotoPosition: newPos },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Metrics */}
              {activeTab === 'metrics' && (
                <div className="space-y-4 max-w-2xl">
                  <h3 className="font-serif text-lg font-bold text-[#2C1810] border-b border-[#7B4B2A]/15 pb-2">
                    Contadores de Métricas Globais (Mensais)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-[#7B4B2A]/20 space-y-2">
                      <label className="block text-xs font-bold text-[#2C1810]">Alcance Mensal</label>
                      <input
                        type="number"
                        value={formData.metrics.monthlyReach}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: { ...formData.metrics, monthlyReach: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl"
                      />
                      <label className="block text-[10px] text-[#7B4B2A]">Texto Exibido</label>
                      <input
                        type="text"
                        value={formData.metrics.monthlyReachLabel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: { ...formData.metrics, monthlyReachLabel: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#7B4B2A]/20 space-y-2">
                      <label className="block text-xs font-bold text-[#2C1810]">Engajamento Total</label>
                      <input
                        type="number"
                        value={formData.metrics.totalEngagement}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: { ...formData.metrics, totalEngagement: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl"
                      />
                      <label className="block text-[10px] text-[#7B4B2A]">Texto Exibido</label>
                      <input
                        type="text"
                        value={formData.metrics.totalEngagementLabel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: { ...formData.metrics, totalEngagementLabel: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#7B4B2A]/20 space-y-2">
                      <label className="block text-xs font-bold text-[#2C1810]">Impressões Mensais</label>
                      <input
                        type="number"
                        value={formData.metrics.monthlyImpressions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: { ...formData.metrics, monthlyImpressions: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl"
                      />
                      <label className="block text-[10px] text-[#7B4B2A]">Texto Exibido</label>
                      <input
                        type="text"
                        value={formData.metrics.monthlyImpressionsLabel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metrics: { ...formData.metrics, monthlyImpressionsLabel: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Instagram */}
              {activeTab === 'instagram' && (
                <AdminInstagramEditor
                  instagram={formData.instagram}
                  onChange={(updatedInstagram) =>
                    setFormData({
                      ...formData,
                      instagram: updatedInstagram,
                    })
                  }
                />
              )}

              {/* Tab 5: TikTok */}
              {activeTab === 'tiktok' && (
                <AdminTikTokEditor
                  tiktok={formData.tiktok}
                  onChange={(updatedTikTok) =>
                    setFormData({
                      ...formData,
                      tiktok: updatedTikTok,
                    })
                  }
                />
              )}

              {/* Tab 6: Editorial Segments */}
              {activeTab === 'segments' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="flex items-center justify-between border-b border-[#7B4B2A]/15 pb-2">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#2C1810]">
                        Pilares Editoriais (Cards)
                      </h3>
                      <p className="text-xs text-[#7B4B2A]">
                        Adicione, edite ou remova os nichos de atuação da criadora.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSegment}
                      className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F5EFE9] border border-[#D4AF37]/50 rounded-xl text-xs font-semibold text-[#4A2E1F] transition-colors"
                    >
                      + Novo Pilar
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.segments.map((seg, idx) => (
                      <div
                        key={seg.id || idx}
                        className="bg-white p-4 rounded-2xl border border-[#7B4B2A]/20 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={seg.tag}
                            onChange={(e) => handleSegmentChange(idx, 'tag', e.target.value)}
                            placeholder="01 / BELEZA"
                            className="text-xs font-serif italic text-[#B8860B] font-semibold bg-transparent border-b border-dashed border-[#B8860B]/40 focus:outline-none w-32"
                          />
                          {formData.segments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSegment(idx)}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] text-[#7B4B2A] mb-0.5">Título do Pilar</label>
                          <input
                            type="text"
                            value={seg.title}
                            onChange={(e) => handleSegmentChange(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl font-semibold text-[#2C1810]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-[#7B4B2A] mb-0.5">Descrição</label>
                          <textarea
                            rows={2}
                            value={seg.description}
                            onChange={(e) => handleSegmentChange(idx, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#7B4B2A]/25 rounded-xl text-[#4A2E1F]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 6: Brands / Parcerias */}
              {activeTab === 'brands' && (
                <AdminBrandsEditor
                  brands={formData.brands || []}
                  onChange={(newBrands) => {
                    setIsDirty(true);
                    setFormData({ ...formData, brands: newBrands });
                  }}
                  onSaveDirect={handleSave}
                  saving={saving}
                />
              )}

              {/* Tab 7: Formatos de Parceria */}
              {activeTab === 'formats' && (
                <AdminPartnershipFormatsEditor
                  formats={formData.partnershipFormats || []}
                  onChange={(newFormats) =>
                    setFormData({ ...formData, partnershipFormats: newFormats })
                  }
                />
              )}

              {/* Tab 8: Contact */}
              {activeTab === 'contact' && (
                <div className="space-y-4 max-w-2xl">
                  <h3 className="font-serif text-lg font-bold text-[#2C1810] border-b border-[#7B4B2A]/15 pb-2">
                    Informações de Contato Comercial
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">E-mail Comercial</label>
                      <input
                        type="email"
                        value={formData.contact.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact: { ...formData.contact, email: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Nome da Assessoria</label>
                      <input
                        type="text"
                        value={formData.contact.managerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact: { ...formData.contact, managerName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">WhatsApp (apenas números)</label>
                      <input
                        type="text"
                        value={formData.contact.whatsapp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact: { ...formData.contact, whatsapp: e.target.value },
                          })
                        }
                        placeholder="5511999887766"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7B4B2A] mb-1">Tempo Médio de Resposta</label>
                      <input
                        type="text"
                        value={formData.contact.responseTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact: { ...formData.contact, responseTime: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#7B4B2A]/25 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer actions when logged in */}
        {user && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#7B4B2A]/15 bg-[#F5EFE9] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Deseja restaurar todos os valores para o padrão de fábrica?')) {
                    await onReset();
                    setSavedSuccess(true);
                    setTimeout(() => setSavedSuccess(false), 3000);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7B4B2A] hover:bg-white/60 border border-[#7B4B2A]/20 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              {/* Cloud Storage Gauge & Auto-Adequacy Action */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition-all ${
                  calculatePayloadSizeKb(formData) > 550
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-[#7B4B2A]/20 text-[#4A2E1F]'
                }`}
                title="Tamanho total das informações no Firestore (limite de 1.000 KB)"
              >
                <Cloud className={`w-3.5 h-3.5 ${calculatePayloadSizeKb(formData) > 550 ? 'text-amber-600' : 'text-[#B8860B]'}`} />
                <span>
                  Nuvem: <strong>{calculatePayloadSizeKb(formData)} KB</strong> / 1.000 KB
                </span>
                <button
                  type="button"
                  onClick={handleAutoAdequateAll}
                  disabled={isAutoAdequating}
                  className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FAF7F2] hover:bg-[#F5EFE9] text-[#4A2E1F] border border-[#7B4B2A]/20 cursor-pointer disabled:opacity-50"
                  title="Adequar e converter automaticamente todas as fotos para o padrão WebP ultra-leve"
                >
                  <Sparkles className={`w-3 h-3 text-[#D4AF37] ${isAutoAdequating ? 'animate-spin' : ''}`} />
                  <span>{isAutoAdequating ? 'Adequando...' : 'Auto-Adequar'}</span>
                </button>
              </div>

              {autoAdequateMessage && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold animate-fadeIn bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{autoAdequateMessage}</span>
                </div>
              )}

              {savedSuccess && (
                <div className="inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold animate-fadeIn bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Publicado na nuvem com sucesso!</span>
                </div>
              )}

              {errorMessage && (
                <div className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold animate-fadeIn bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 flex-wrap">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleAutoAdequateAll();
                      await handleSave();
                    }}
                    className="ml-1 underline text-red-800 font-bold hover:text-red-950 cursor-pointer"
                  >
                    Auto-Adequar e Salvar Agora
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs text-[#4A2E1F] hover:bg-white/60 border border-[#7B4B2A]/20 rounded-xl font-medium transition-colors text-center cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 bg-[#4A2E1F] hover:bg-[#2C1810] text-[#FAF7F2] rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{saving ? 'Publicando...' : 'Salvar Alterações na Nuvem'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
