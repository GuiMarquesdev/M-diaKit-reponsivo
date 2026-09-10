export interface SegmentItem {
  id: string;
  tag: string;
  title: string;
  description: string;
}

export interface DemographicsAge {
  range: string;
  percent: number;
}

export interface DemographicsCity {
  city: string;
  percent: number;
}

export interface BrandPartner {
  id: string;
  name: string;
  logoUrl: string;
  status: 'active' | 'past'; // 'active' = 'Trabalho Atual / Parceria Ativa', 'past' = 'Já Trabalhou / Case Concluído'
  category?: string; // ex: 'Cachos & Cuidados Capilares', 'Dermocosméticos', 'Fitness & Suplementos', 'Moda & Calçados'
  campaignType?: string; // ex: 'Embaixadora Oficial', 'Campanha Reels', 'Lançamento', 'Publi Exclusiva'
  websiteUrl?: string; // Link da marca ou da campanha
}

export interface PartnershipFormat {
  id: string;
  name: string;
  description?: string;
  badge?: string; // ex: 'Mais Pedido', 'Alto Alcance', 'Embaixadora', 'Presencial'
  active?: boolean; // Se aparece ou não na lista de seleção de proposta
}

export interface MediaKitData {
  creator: {
    name: string;
    title: string;
    subtitle: string;
    quote: string;
    bioParagraph1: string;
    bioParagraph2: string;
    location: string;
    niche: string;
    profilePhoto: string;
    heroPhoto: string;
    aboutPhoto: string;
    closingPhoto: string;
    heroPhotoPosition?: string;
    aboutPhotoPosition?: string;
    closingPhotoPosition?: string;
    profilePhotoPosition?: string;
  };
  metrics: {
    monthlyReach: number;
    monthlyReachLabel: string;
    totalEngagement: number;
    totalEngagementLabel: string;
    monthlyImpressions: number;
    monthlyImpressionsLabel: string;
  };
  instagram: {
    handle: string;
    profileUrl: string;
    followers: string;
    reach: string;
    engagement: string;
    viewsPerReels: string;
    femaleAudience: number;
    maleAudience: number;
    ageData: DemographicsAge[];
    cityData: DemographicsCity[];
    bestReelViews: string;
  };
  tiktok: {
    handle: string;
    profileUrl: string;
    followers: string;
    likes: string;
    avgViews: string;
    viralRecord: string;
    femaleAudience: number;
    maleAudience: number;
    ageData: DemographicsAge[];
    cityData: DemographicsCity[];
  };
  segments: SegmentItem[];
  brands: BrandPartner[];
  partnershipFormats?: PartnershipFormat[];
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    managerName: string;
    responseTime: string;
  };
}

export interface CommercialLead {
  id?: string;
  name: string;
  email: string;
  brand: string;
  budget: string;
  message: string;
  createdAt: string;
  status?: 'new' | 'contacted' | 'closed';
}
