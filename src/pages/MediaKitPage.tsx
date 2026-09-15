import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Instagram,
  Heart,
  Eye,
  TrendingUp,
  Mail,
  MessageCircle,
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  Users,
  Copy,
  Check,
  Send,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { useMediaKitData } from '../hooks/useMediaKitData';
import { useAuth } from '../context/AuthContext';
import { BrandsSection } from '../components/BrandsSection';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// TikTok Custom Icon
const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.043.87.126V9.4a6.33 6.33 0 0 0-.87-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.87-4.48V8.75a8.17 8.17 0 0 0 4.9 1.62V6.93c-.34 0-.68-.08-1-.24z"/>
  </svg>
);

// Formatted Metric Value for crisp, perfectly aligned typography
export const FormattedMetricValue: React.FC<{ value: string }> = ({ value }) => {
  const match = value.match(/^([0-9.,]+)\s*([A-Za-z%]*)\s*(\+?)(.*)$/);
  if (!match) {
    return <span className="lining-nums tabular-nums font-serif font-bold text-[#2C1810]">{value}</span>;
  }
  const [, num, unit, plus, rest] = match;
  return (
    <span className="inline-flex items-baseline justify-center tracking-tight leading-none select-none">
      <span className="lining-nums tabular-nums font-serif font-bold text-[#2C1810]">{num}</span>
      {unit && <span className="font-serif font-bold text-[#2C1810] ml-0.5">{unit}</span>}
      {plus && (
        <span className="font-sans font-semibold text-[#B8860B] text-[0.65em] ml-1 self-center translate-y-[-0.1em]">
          +
        </span>
      )}
      {rest && <span className="text-sm font-normal text-[#7B4B2A] ml-1">{rest}</span>}
    </span>
  );
};

export const MediaKitPage: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useMediaKitData();
  const { submitLead, user } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Atalho restrito estritamente à fase de desenvolvimento (localhost, 127.0.0.1 ou AI Studio Dev)
    // Em fase de produção (Vercel, domínio final ou build de produção), o comando é 100% desativado.
    const isDevelopment =
      Boolean((import.meta as any).env?.DEV) === true ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('ais-dev-');

    if (!isDevelopment) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut Ctrl+Shift+A ou Cmd+Shift+A apenas em desenvolvimento
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/admin789459');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Contact form inputs
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadBudget, setLeadBudget] = useState('Combo Reels + Stories (Instagram)');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSubmittedData, setLeadSubmittedData] = useState<{
    name: string;
    email: string;
    phone: string;
    budget: string;
    message: string;
  } | null>(null);

  // Partnership Formats from Admin / Data
  const availableFormats = React.useMemo(() => {
    if (data.partnershipFormats && data.partnershipFormats.length > 0) {
      const activeList = data.partnershipFormats.filter((f) => f.active !== false);
      if (activeList.length > 0) return activeList;
    }
    return [
      { id: 'f1', name: 'Combo Reels + Stories (Instagram)', badge: 'Mais Pedido', description: '1 Reels no feed em collab + sequência de 3 Stories com link.' },
      { id: 'f2', name: 'Vídeo Dedicado no TikTok', badge: 'Alto Alcance', description: '1 Vídeo nativo no TikTok de alta retenção.' },
      { id: 'f3', name: 'Embaixadorismo / Contrato Mensal', badge: 'Contrato Longo', description: 'Parceria contínua de 3 a 6 meses e uso de imagem.' },
      { id: 'f4', name: 'Presença VIP em Evento / Workshop', badge: 'Presencial', description: 'Presença e cobertura completa em tempo real.' },
      { id: 'f5', name: 'Outro formato personalizado', badge: 'Personalizado', description: 'Formato especial customizado sob demanda.' },
    ];
  }, [data.partnershipFormats]);

  // Keep selected format aligned with available list
  useEffect(() => {
    if (availableFormats.length > 0 && !availableFormats.some((f) => f.name === leadBudget)) {
      setLeadBudget(availableFormats[0].name);
    }
  }, [availableFormats, leadBudget]);

  // Copy handle helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHandle(label);
    setTimeout(() => setCopiedHandle(null), 2500);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentLead = {
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      budget: leadBudget,
      message: leadMessage,
    };
    
    setLeadSubmittedData(currentLead);

    // Save lead in cloud database (Firestore)
    await submitLead({
      name: leadName,
      email: leadEmail,
      brand: leadName,
      budget: leadBudget,
      message: `${leadMessage} (Telefone/WhatsApp informado: ${leadPhone || 'Não informado'})`,
    });

    setFormSubmitted(true);
  };

  const generateProposalMessage = () => {
    const info = leadSubmittedData || {
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      budget: leadBudget,
      message: leadMessage,
    };
    return (
      `Nova Proposta Comercial - Mídia Kit\n\n` +
      `Nome / Marca: ${info.name}\n` +
      `E-mail de Contato: ${info.email}\n` +
      `Telefone de Contato: ${info.phone || 'Não informado'}\n` +
      `Formato de Interesse: ${info.budget}\n` +
      `Mensagem / Briefing: ${info.message || 'Gostaria de receber a grade de valores e disponibilidade da Sophia Menezes.'}`
    );
  };

  const getMailtoUrl = () => {
    const targetEmail = data.contact.email || 'Sophiaamenezes10@gmail.com';
    const subject = encodeURIComponent(`[Proposta Comercial] ${leadSubmittedData?.name || leadName} - Mídia Kit`);
    const body = encodeURIComponent(generateProposalMessage());
    return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  const getGmailUrl = () => {
    const targetEmail = data.contact.email || 'Sophiaamenezes10@gmail.com';
    const subject = encodeURIComponent(`[Proposta Comercial] ${leadSubmittedData?.name || leadName} - Mídia Kit`);
    const body = encodeURIComponent(generateProposalMessage());
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${subject}&body=${body}`;
  };

  const handleOpenEmail = () => {
    window.location.href = getMailtoUrl();
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Reveal Animations
      gsap.from('.hero-badge', {
        opacity: 0,
        y: 20,
        duration: 0.9,
        ease: 'power3.out',
      });

      gsap.from('.hero-title-line', {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 1.1,
        ease: 'power3.out',
        delay: 0.2,
      });

      gsap.from('.hero-subtext', {
        opacity: 0,
        y: 25,
        duration: 1.0,
        ease: 'power3.out',
        delay: 0.4,
      });

      gsap.from('.hero-handles', {
        opacity: 0,
        y: 20,
        duration: 1.0,
        ease: 'power3.out',
        delay: 0.6,
      });

      gsap.from('.hero-image-wrapper', {
        opacity: 0,
        scale: 0.92,
        y: 35,
        duration: 1.3,
        ease: 'power3.out',
        delay: 0.3,
      });

      // Subtle Hero Image Parallax on Scroll
      if (heroImageRef.current) {
        gsap.to(heroImageRef.current, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // 2. Section Headings & Text Reveals
      const revealSections = gsap.utils.toArray<HTMLElement>('.gsap-reveal');
      revealSections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {
              trigger: section,
              start: 'top 95%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // 3. Staggered Bio & Cards
      gsap.fromTo(
        '.bio-stagger',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: '.bio-section',
            start: 'top 95%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 4. Segment Cards Stagger
      gsap.fromTo(
        '.segment-item',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: '.segments-section',
            start: 'top 95%',
            toggleActions: 'play none none none',
          },
        }
      );

      // 5. Metric Numbers Count-Up
      const reachVal = data.metrics.monthlyReach / 1000000;
      const engVal = data.metrics.totalEngagement / 1000;
      const impVal = data.metrics.monthlyImpressions / 1000000;

      const metricCounters = [
        { id: '#counter-reach', target: reachVal, suffix: 'M+', decimals: 1 },
        { id: '#counter-eng', target: engVal, suffix: 'K+', decimals: 0 },
        { id: '#counter-imp', target: impVal, suffix: 'M+', decimals: 1 },
      ];

      metricCounters.forEach(({ id, target, suffix, decimals }) => {
        const el = document.querySelector(id);
        if (!el) return;
        const obj = { val: 0 };
        const unit = suffix.replace('+', '').trim();
        const hasPlus = suffix.includes('+');

        gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.metrics-overview-section',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            const numFormatted = obj.val.toFixed(decimals);
            el.innerHTML = `
              <span class="inline-flex items-baseline justify-center tracking-tight leading-none select-none">
                <span class="lining-nums tabular-nums font-serif font-bold text-[#2C1810]">${numFormatted}</span>
                ${unit ? `<span class="font-serif font-bold text-[#2C1810] ml-0.5">${unit}</span>` : ''}
                ${hasPlus ? `<span class="font-sans font-bold text-[#B8860B] text-[0.65em] ml-1 self-center translate-y-[-0.1em]">+</span>` : ''}
              </span>
            `;
          },
        });
      });

      // 6. Demographics Progress Bars
      const progressBars = gsap.utils.toArray<HTMLElement>('.gsap-bar');
      progressBars.forEach((bar) => {
        const targetWidth = bar.getAttribute('data-target-width') || '0%';
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: targetWidth,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 92%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // 7. Footer / Closing CTA Reveal
      gsap.fromTo(
        '.cta-box',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: '.cta-box',
            start: 'top 95%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Ensure all positions are correctly calculated once images and fonts are loaded
      const handleRefresh = () => ScrollTrigger.refresh();
      window.addEventListener('load', handleRefresh);
      setTimeout(handleRefresh, 200);
      setTimeout(handleRefresh, 600);

      return () => {
        window.removeEventListener('load', handleRefresh);
      };
    }, containerRef);

    return () => ctx.revert();
  }, [data]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F5EFE9] text-[#4A2E1F] font-sans selection:bg-[#D4AF37]/30 selection:text-[#2C1810] relative overflow-hidden">
      
      {/* Background Decorative Lines & Organic Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-40 editorial-grain z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full border-x border-[#7B4B2A]/10 pointer-events-none z-0" />

      {/* Top Editorial Ribbon / Header */}
      <header className="relative z-10 w-full border-b border-[#7B4B2A]/15 bg-[#F5EFE9]/85 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-serif italic text-lg md:text-xl font-semibold tracking-wide text-[#4A2E1F]">
              {data.creator.name}
            </span>
            <span className="text-[#D4AF37]">•</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#7B4B2A]/80 font-medium hidden sm:inline">
              Mídia Kit Oficial
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin route link - only visible if logged in */}
            {user && (
              <Link
                to="/admin789459"
                className="text-xs font-semibold text-[#FAF7F2] bg-[#4A2E1F] hover:bg-[#2C1810] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xs cursor-pointer"
                title="Acessar Painel Admin"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">Painel Admin</span>
              </Link>
            )}

            <a
              href={data.instagram.profileUrl || `https://instagram.com/${data.instagram.handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-wider font-semibold text-[#7B4B2A] hover:text-[#B8860B] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#7B4B2A]/20 hover:border-[#D4AF37]"
            >
              <Instagram className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="hidden md:inline">{data.instagram.handle}</span>
            </a>

            <button
              onClick={() => setContactModalOpen(true)}
              className="bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow flex items-center gap-1.5"
            >
              <span>Parcerias</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-16 space-y-24 md:space-y-36">
        
        {/* =========================================================================
            SECTION 1: HERO
        ========================================================================= */}
        <section className="hero-section pt-4 md:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left order-2 lg:order-1">
              
              {/* Badge */}
              <div className="hero-badge inline-flex items-center">
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                  Mídia Kit Oficial
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight text-[#2C1810] leading-[1.08]">
                  <span className="hero-title-line block">{data.creator.name.split(' ')[0]}</span>
                  <span className="hero-title-line block font-serif italic text-[#7B4B2A]">
                    {data.creator.name.split(' ').slice(1).join(' ')}
                  </span>
                </h1>
                <div className="w-20 h-[2px] bg-gradient-to-r from-[#D4AF37] to-transparent mx-auto lg:mx-0 my-4" />
              </div>

              {/* Pitch Subtext */}
              <p className="hero-subtext text-lg sm:text-xl text-[#7B4B2A] max-w-xl font-light leading-relaxed">
                {data.creator.subtitle}
              </p>

              {/* Social Media Handles Pill Cards */}
              <div className="hero-handles flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                
                {/* Instagram Handle */}
                <div className="flex items-center gap-3 bg-[#FAF7F2] px-4 py-3 rounded-2xl border border-[#7B4B2A]/15 hover:border-[#D4AF37] transition-all duration-300 shadow-xs group">
                  <Instagram className="w-5 h-5 text-[#B8860B] group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-widest text-[#7B4B2A]/70 font-semibold block">Instagram</span>
                    <a
                      href={data.instagram.profileUrl || `https://instagram.com/${data.instagram.handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-[#4A2E1F] hover:text-[#B8860B] transition-colors flex items-center gap-1"
                    >
                      {data.instagram.handle}
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#B8860B]" />
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.instagram.handle, 'ig')}
                    title="Copiar usuário"
                    className="p-1.5 text-[#7B4B2A]/60 hover:text-[#B8860B] hover:bg-[#F5EFE9] rounded-lg transition-colors ml-1"
                  >
                    {copiedHandle === 'ig' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* TikTok Handle */}
                <div className="flex items-center gap-3 bg-[#FAF7F2] px-4 py-3 rounded-2xl border border-[#7B4B2A]/15 hover:border-[#D4AF37] transition-all duration-300 shadow-xs group">
                  <TikTokIcon className="w-5 h-5 text-[#B8860B] group-hover:scale-110 transition-transform shrink-0" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-widest text-[#7B4B2A]/70 font-semibold block">TikTok</span>
                    <a
                      href={data.tiktok.profileUrl || `https://tiktok.com/@${data.tiktok.handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-[#4A2E1F] hover:text-[#B8860B] transition-colors flex items-center gap-1"
                    >
                      {data.tiktok.handle}
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#B8860B]" />
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.tiktok.handle, 'tk')}
                    title="Copiar usuário"
                    className="p-1.5 text-[#7B4B2A]/60 hover:text-[#B8860B] hover:bg-[#F5EFE9] rounded-lg transition-colors ml-1"
                  >
                    {copiedHandle === 'tk' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {/* Key Quick Highlight */}
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs tracking-wider uppercase text-[#7B4B2A]/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  {data.creator.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  {data.creator.niche}
                </span>
              </div>

            </div>

            {/* Right Featured Photo with Sticker Effect */}
            <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
              <div className="hero-image-wrapper relative group max-w-sm sm:max-w-md w-full">
                
                {/* Floating Badges */}
                <div className="absolute -bottom-4 -left-3 z-20 bg-[#4A2E1F] text-[#FAF7F2] px-4 py-2 rounded-full border border-[#D4AF37]/40 shadow-lg flex items-center">
                  <span className="text-[11px] uppercase tracking-widest font-semibold">
                    Conteúdo Autêntico
                  </span>
                </div>

                {/* Sticker Frame Photo */}
                <div 
                  ref={heroImageRef}
                  className="sticker-frame-hero rounded-3xl overflow-hidden bg-[#FAF7F2] aspect-[4/5] relative will-change-transform"
                >
                  <img
                    src={data.creator.heroPhoto}
                    alt={`${data.creator.name} - Criadora de Conteúdo`}
                    loading="lazy"
                    style={{ objectPosition: data.creator.heroPhotoPosition || '50% 15%' }}
                    className="w-full h-full object-cover filter contrast-[1.03] saturate-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#4A2E1F]/30 via-transparent to-transparent pointer-events-none" />
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 2: QUEM É A CRIADORA?
        ========================================================================= */}
        <section className="bio-section relative pt-4">
          
          <div className="flex items-center gap-4 mb-10 gsap-reveal">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-[#D4AF37]" />
            <div className="flex items-center">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                Apresentação
              </span>
            </div>
            <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37]/50 to-[#D4AF37]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Lateral Photo with Frame */}
            <div className="lg:col-span-5 bio-stagger">
              <div className="relative max-w-sm mx-auto">
                <div className="sticker-frame rounded-2xl overflow-hidden aspect-[3/4] bg-[#FAF7F2]">
                  <img
                    src={data.creator.aboutPhoto}
                    alt={`${data.creator.name} Cachos e Lifestyle`}
                    loading="lazy"
                    style={{ objectPosition: data.creator.aboutPhotoPosition || '50% 50%' }}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative gold caption card */}
                <div className="absolute -bottom-5 right-4 bg-[#FAF7F2] border border-[#D4AF37]/40 px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2">
                  <span className="font-serif italic text-sm text-[#4A2E1F] font-semibold">
                    {data.creator.quote}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio in Columns */}
            <div className="lg:col-span-7 space-y-6 bio-stagger">
              
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1810]">
                  Quem é <span className="italic text-[#7B4B2A]">{data.creator.name}?</span>
                </h2>
                <div className="w-16 h-[2px] bg-[#D4AF37]" />
              </div>

              <div className="space-y-5 text-base sm:text-lg text-[#5A3825] leading-relaxed font-light">
                <p>{data.creator.bioParagraph1}</p>
                <p>{data.creator.bioParagraph2}</p>
                <p className="bg-[#FAF7F2] p-5 rounded-2xl border-l-4 border-[#D4AF37] border-y border-r border-[#7B4B2A]/10 italic font-serif text-[#4A2E1F] text-lg">
                  {data.creator.quote}
                </p>
              </div>

              {/* Core Values Bullets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#7B4B2A]/10 text-center">
                  <span className="block text-xs uppercase tracking-widest text-[#7B4B2A] font-semibold">Origem</span>
                  <span className="font-serif text-base text-[#2C1810] font-medium">{data.creator.location.split('•')[0] || 'Brasil'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#7B4B2A]/10 text-center">
                  <span className="block text-xs uppercase tracking-widest text-[#7B4B2A] font-semibold">Foco</span>
                  <span className="font-serif text-base text-[#2C1810] font-medium">{data.creator.title}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#7B4B2A]/10 text-center col-span-2 sm:col-span-1">
                  <span className="block text-xs uppercase tracking-widest text-[#7B4B2A] font-semibold">Comunidade</span>
                  <span className="font-serif text-base text-[#2C1810] font-medium">Engajada & Real</span>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* =========================================================================
            SECTION 3: SEGMENTOS
        ========================================================================= */}
        <section className="segments-section relative">
          
          <div className="text-center max-w-2xl mx-auto mb-14 gsap-reveal space-y-3">
            <div className="inline-flex items-center">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                Pilares Editoriais
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1810]">
              Segmentos de <span className="italic text-[#7B4B2A]">Conteúdo</span>
            </h2>
            <p className="text-sm sm:text-base text-[#7B4B2A] font-light">
              Uma curadoria de narrativas que conectam marcas a uma audiência altamente qualificada.
            </p>
          </div>

          <div className="segments-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.segments.map((seg) => (
              <div
                key={seg.id}
                className="segment-item group relative bg-[#FAF7F2] rounded-3xl p-7 border border-[#7B4B2A]/15 hover:border-[#D4AF37] transition-all duration-300 warm-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif italic text-[#B8860B] font-semibold tracking-widest uppercase">
                      {seg.tag.replace(/^(\d+\s*[\/•\-–—]\s*|\d+\s*)/, '')}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif text-[#2C1810] group-hover:text-[#B8860B] transition-colors">
                    {seg.title}
                  </h3>
                  <p className="text-sm text-[#7B4B2A] leading-relaxed font-light">
                    {seg.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#7B4B2A]/10 flex items-center justify-between text-xs font-medium text-[#7B4B2A]">
                  <span>Pilar Oficial</span>
                  <span className="text-[#D4AF37] font-serif italic">Alta Conversão</span>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* =========================================================================
            SECTION 4: AUDIÊNCIA MENSAL (COUNT-UP)
        ========================================================================= */}
        <section className="metrics-overview-section relative">
          
          <div className="text-center max-w-2xl mx-auto mb-12 gsap-reveal space-y-3">
            <div className="inline-flex items-center">
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                Alcance & Expressividade
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1810]">
              Audiência <span className="italic text-[#7B4B2A]">Mensal</span>
            </h2>
            <p className="text-sm sm:text-base text-[#7B4B2A] font-light">
              Métricas consolidadas de alcance, envolvimento e frequência de impressões.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metric 1: Alcance */}
            <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-[#D4AF37]/30 text-center relative warm-shadow group hover:border-[#D4AF37] transition-all">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-[#B8860B] animate-trending-up" />
              <span className="text-xs uppercase tracking-[0.2em] text-[#7B4B2A] font-semibold block mb-2">
                Alcance Mensal
              </span>
              <div id="counter-reach" className="text-5xl sm:text-6xl font-serif font-bold text-[#2C1810] tracking-tight flex items-center justify-center min-h-[3.75rem]">
                <FormattedMetricValue value={data.metrics.monthlyReachLabel} />
              </div>
              <p className="text-xs text-[#7B4B2A]/80 mt-3 font-medium">
                Contas únicas alcançadas mensalmente
              </p>
            </div>

            {/* Metric 2: Engajamento */}
            <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-[#D4AF37]/30 text-center relative warm-shadow group hover:border-[#D4AF37] transition-all">
              <Heart className="w-8 h-8 mx-auto mb-3 text-[#B8860B] fill-[#B8860B]/20 animate-heartbeat" />
              <span className="text-xs uppercase tracking-[0.2em] text-[#7B4B2A] font-semibold block mb-2">
                Engajamento Total
              </span>
              <div id="counter-eng" className="text-5xl sm:text-6xl font-serif font-bold text-[#2C1810] tracking-tight flex items-center justify-center min-h-[3.75rem]">
                <FormattedMetricValue value={data.metrics.totalEngagementLabel} />
              </div>
              <p className="text-xs text-[#7B4B2A]/80 mt-3 font-medium">
                Curtidas, comentários, salvamentos e envios
              </p>
            </div>

            {/* Metric 3: Impressões */}
            <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-[#D4AF37]/30 text-center relative warm-shadow group hover:border-[#D4AF37] transition-all">
              <Eye className="w-8 h-8 mx-auto mb-3 text-[#B8860B] animate-eye-blink" />
              <span className="text-xs uppercase tracking-[0.2em] text-[#7B4B2A] font-semibold block mb-2">
                Impressões Mensais
              </span>
              <div id="counter-imp" className="text-5xl sm:text-6xl font-serif font-bold text-[#2C1810] tracking-tight flex items-center justify-center min-h-[3.75rem]">
                <FormattedMetricValue value={data.metrics.monthlyImpressionsLabel} />
              </div>
              <p className="text-xs text-[#7B4B2A]/80 mt-3 font-medium">
                Visualizações totais distribuídas nos formatos
              </p>
            </div>

          </div>

        </section>

        {/* =========================================================================
            SECTION 5: MÉTRICAS INSTAGRAM
        ========================================================================= */}
        <section className="instagram-section relative">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#7B4B2A]/15 gsap-reveal gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <Instagram className="w-4 h-4 text-[#B8860B]" />
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                  Canal Principal
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1810]">
                Métricas <span className="italic text-[#7B4B2A]">Instagram</span>
              </h2>
            </div>
            <a
              href={data.instagram.profileUrl || `https://instagram.com/${data.instagram.handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-sm text-[#4A2E1F] hover:text-[#B8860B] transition-colors"
            >
              <span>Ver perfil {data.instagram.handle}</span>
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Instagram: Localização */}
            <div className="bg-[#FAF7F2] rounded-3xl p-7 sm:p-8 border border-[#7B4B2A]/15 warm-shadow space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2C1810]">
                    Principais Cidades
                  </h3>
                </div>
                <span className="text-xs uppercase tracking-widest text-[#7B4B2A]/70 font-semibold">Localização</span>
              </div>

              <div className="space-y-4 pt-2">
                {data.instagram.cityData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-wider text-[#4A2E1F]">
                      <span>{item.city}</span>
                      <span className="font-mono text-[#B8860B]">{item.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-[#ECE2D8] rounded-full overflow-hidden">
                      <div
                        className="gsap-bar h-full rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37]"
                        data-target-width={`${Math.min(item.percent * 2, 100)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instagram: Faixa Etária */}
            <div className="bg-[#FAF7F2] rounded-3xl p-7 sm:p-8 border border-[#7B4B2A]/15 warm-shadow space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2C1810]">
                    Faixa Etária
                  </h3>
                </div>
                <span className="text-xs uppercase tracking-widest text-[#7B4B2A]/70 font-semibold">Idade</span>
              </div>

              <div className="space-y-4 pt-2">
                {data.instagram.ageData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-wider text-[#4A2E1F]">
                      <span className="flex items-center gap-1.5">
                        {item.range}
                        {idx === 1 && (
                          <span className="text-[10px] bg-[#D4AF37]/20 text-[#8C5E3C] px-1.5 py-0.5 rounded font-bold">Público Principal</span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-[#B8860B]">{item.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-[#ECE2D8] rounded-full overflow-hidden">
                      <div
                        className="gsap-bar h-full rounded-full bg-gradient-to-r from-[#7B4B2A] via-[#B8860B] to-[#D4AF37]"
                        data-target-width={`${Math.min(item.percent * 1.8, 100)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>

        {/* =========================================================================
            SECTION 6: MÉTRICAS TIKTOK
        ========================================================================= */}
        <section className="tiktok-section relative">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#7B4B2A]/15 gsap-reveal gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <TikTokIcon className="w-4 h-4 text-[#B8860B]" />
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                  Engajamento Viral
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#2C1810]">
                Métricas <span className="italic text-[#7B4B2A]">TikTok</span>
              </h2>
            </div>
            <a
              href={data.tiktok.profileUrl || `https://tiktok.com/@${data.tiktok.handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-sm text-[#4A2E1F] hover:text-[#B8860B] transition-colors"
            >
              <span>Ver perfil {data.tiktok.handle}</span>
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* TikTok: Localização */}
            <div className="bg-[#FAF7F2] rounded-3xl p-7 sm:p-8 border border-[#7B4B2A]/15 warm-shadow space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2C1810]">
                    Distribuição Geográfica
                  </h3>
                </div>
                <span className="text-xs uppercase tracking-widest text-[#7B4B2A]/70 font-semibold">Localização</span>
              </div>

              <div className="space-y-4 pt-2">
                {data.tiktok.cityData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-wider text-[#4A2E1F]">
                      <span>{item.city}</span>
                      <span className="font-mono text-[#B8860B]">{item.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-[#ECE2D8] rounded-full overflow-hidden">
                      <div
                        className="gsap-bar h-full rounded-full bg-gradient-to-r from-[#7B4B2A] to-[#B8860B]"
                        data-target-width={`${Math.min(item.percent * 2, 100)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TikTok: Faixa Etária */}
            <div className="bg-[#FAF7F2] rounded-3xl p-7 sm:p-8 border border-[#7B4B2A]/15 warm-shadow space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2C1810]">
                    Faixa Etária
                  </h3>
                </div>
                <span className="text-xs uppercase tracking-widest text-[#7B4B2A]/70 font-semibold">Idade</span>
              </div>

              <div className="space-y-4 pt-2">
                {data.tiktok.ageData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-wider text-[#4A2E1F]">
                      <span className="flex items-center gap-1.5">
                        {item.range}
                        {idx === 0 && (
                          <span className="text-[10px] bg-[#D4AF37]/20 text-[#8C5E3C] px-1.5 py-0.5 rounded font-bold">Gen Z Conectada</span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-[#B8860B]">{item.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-[#ECE2D8] rounded-full overflow-hidden">
                      <div
                        className="gsap-bar h-full rounded-full bg-gradient-to-r from-[#7B4B2A] via-[#B8860B] to-[#D4AF37]"
                        data-target-width={`${Math.min(item.percent * 1.8, 100)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>

        {/* =========================================================================
            SECTION 7: MARCAS & PARCERIAS (TRABALHA ATUALMENTE E JÁ TRABALHOU)
        ========================================================================= */}
        <BrandsSection
          brands={data.brands || []}
          onOpenContactModal={() => setContactModalOpen(true)}
        />

        {/* =========================================================================
            SECTION 8: ENCERRAMENTO & CTA
        ========================================================================= */}
        <section className="closing-section pt-6 pb-12">
          <div className="cta-box relative bg-[#FAF7F2] rounded-3xl p-8 sm:p-12 md:p-16 border border-[#D4AF37]/40 warm-shadow overflow-hidden text-center max-w-4xl mx-auto">
            
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center">
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#7B4B2A]">
                  Parcerias & Campanhas
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#2C1810] leading-tight">
                  Obrigada! <br />
                  <span className="italic text-[#7B4B2A]">{data.creator.name}</span>
                </h2>
                <div className="w-20 h-[2px] bg-[#D4AF37] mx-auto my-3" />
              </div>

              <p className="text-base sm:text-lg text-[#5A3825] font-light leading-relaxed">
                Pronta para co-criar campanhas memoráveis com storytelling orgânico, estética sofisticada e alto impacto para o seu público.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                
                {/* Primary Proposal button */}
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] text-sm uppercase tracking-widest font-semibold px-7 py-3.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer group"
                >
                  <span>Enviar Proposta Comercial</span>
                </button>

                {/* Secondary Media Kit Request button */}
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="bg-[#FAF7F2] hover:bg-[#F5EFE9] text-[#4A2E1F] border border-[#7B4B2A]/25 hover:border-[#D4AF37] text-sm uppercase tracking-widest font-semibold px-7 py-3.5 rounded-full transition-all duration-300 shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>Solicitar Grade & Valores</span>
                </button>

              </div>

              {/* Direct Contact Handles */}
              <div className="pt-6 border-t border-[#7B4B2A]/10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#7B4B2A] font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#B8860B]" />
                  {data.contact.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-[#B8860B]" />
                  {data.instagram.handle}
                </span>
                <span className="flex items-center gap-1.5">
                  <TikTokIcon className="w-3.5 h-3.5 text-[#B8860B]" />
                  {data.tiktok.handle}
                </span>
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#7B4B2A]/15 py-8 bg-[#F5EFE9] text-center text-xs text-[#7B4B2A]/80">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {data.creator.name} • Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <span>Mídia Kit Digital & Interativo</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          CONTACT / PROPOSAL MODAL
      ========================================================================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1810]/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#D4AF37]/50 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setContactModalOpen(false);
                setFormSubmitted(false);
              }}
              className="absolute top-5 right-5 text-[#7B4B2A] hover:text-[#2C1810] p-1.5 rounded-full hover:bg-[#F5EFE9] transition-colors"
            >
              ✕
            </button>

            {formSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-[#2C1810]">
                    Proposta Registrada com Sucesso!
                  </h3>
                  <p className="text-xs text-[#7B4B2A] font-light max-w-xs mx-auto">
                    Os dados foram salvos no sistema da assessoria de {data.creator.name}.
                  </p>
                </div>

                <div className="bg-[#F5EFE9] border border-[#7B4B2A]/15 rounded-2xl p-4 text-left space-y-3 text-xs text-[#5A3825]">
                  <div className="text-center pb-1 border-b border-[#7B4B2A]/10">
                    <span className="font-semibold text-[#2C1810] text-[11px] uppercase tracking-wider block">
                      Cópia Direta por E-mail
                    </span>
                    <span className="text-[11px] text-[#7B4B2A]">
                      Sua proposta já foi salva. Você também pode enviá-la pelo seu e-mail:
                    </span>
                  </div>

                  <div className="pt-1">
                    {/* Webmail / Gmail Direct */}
                    <a
                      href={getGmailUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] font-semibold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 text-center shadow-xs cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                      <span>Abrir no Gmail</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2 border border-[#7B4B2A]/10 text-[11px]">
                    <span className="text-[#7B4B2A] truncate">
                      {data.contact.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.contact.email, 'E-mail')}
                      className="text-[#B8860B] hover:text-[#7B4B2A] font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#7B4B2A]/80">
                  Tempo médio de resposta: até <strong>{data.contact.responseTime}</strong>.
                </p>

                <button
                  onClick={() => {
                    setContactModalOpen(false);
                    setFormSubmitted(false);
                    setLeadName('');
                    setLeadEmail('');
                    setLeadPhone('');
                    setLeadMessage('');
                  }}
                  className="mt-2 text-[#7B4B2A] hover:text-[#2C1810] text-xs font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center text-xs text-[#B8860B] font-semibold uppercase tracking-wider">
                    <span>{data.contact.managerName}</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#2C1810]">
                    Vamos trabalhar juntas
                  </h3>
                  <p className="text-xs text-[#7B4B2A] font-light">
                    Preencha os dados da sua marca ou campanha para receber nossa proposta personalizada.
                  </p>
                </div>

                <form
                  onSubmit={handleLeadSubmit}
                  className="space-y-3.5 text-left"
                >
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7B4B2A] mb-1">
                      Nome / Empresa
                    </label>
                    <input
                      required
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Ex: Marca de Cosméticos / Agência"
                      className="w-full bg-[#F5EFE9] border border-[#7B4B2A]/20 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-[#2C1810] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7B4B2A] mb-1">
                        E-mail de Contato
                      </label>
                      <input
                        required
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="contato@marca.com"
                        className="w-full bg-[#F5EFE9] border border-[#7B4B2A]/20 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-[#2C1810] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7B4B2A] mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-[#F5EFE9] border border-[#7B4B2A]/20 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-[#2C1810] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7B4B2A]">
                        Formato de Parceria Desejado
                      </label>
                      {user && (
                        <Link
                          to="/admin789459"
                          className="text-[10px] text-[#B8860B] hover:text-[#7B4B2A] font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Gerenciar formatos no painel administrativo"
                        >
                          <SlidersHorizontal className="w-2.5 h-2.5" />
                          <span>Editar Formatos no Admin</span>
                        </Link>
                      )}
                    </div>
                    <select
                      value={leadBudget}
                      onChange={(e) => setLeadBudget(e.target.value)}
                      className="w-full bg-[#F5EFE9] border border-[#7B4B2A]/20 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-[#2C1810] focus:outline-none transition-colors cursor-pointer"
                    >
                      {availableFormats.map((format) => (
                        <option key={format.id} value={format.name}>
                          {format.name} {format.badge ? `• ${format.badge}` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Format description hint */}
                    {(() => {
                      const current = availableFormats.find((f) => f.name === leadBudget);
                      if (!current?.description) return null;
                      return (
                        <p className="text-[11px] text-[#7B4B2A]/85 mt-1.5 px-1 leading-relaxed">
                          {current.description}
                        </p>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7B4B2A] mb-1">
                      Mensagem / Detalhes da Campanha
                    </label>
                    <textarea
                      rows={3}
                      value={leadMessage}
                      onChange={(e) => setLeadMessage(e.target.value)}
                      placeholder="Conte um pouco sobre o produto ou objetivo da campanha..."
                      className="w-full bg-[#F5EFE9] border border-[#7B4B2A]/20 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-sm text-[#2C1810] focus:outline-none transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4A2E1F] hover:bg-[#7B4B2A] text-[#FAF7F2] py-3 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    <Send className="w-4 h-4 text-[#D4AF37]" />
                    <span>Enviar Solicitação</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
