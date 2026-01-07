export interface Feature {
    id: number;
    icon: string;
    title: string;
    description: string;
  }
  
  export interface Benefit {
    id: number;
    icon: string;
    title: string;
    description: string;
    badge?: string;
  }
  
  export interface Testimonial {
    id: number;
    name: string;
    role: string;
    avatar: string;
    alt: string;
    rating: number;
    comment: string;
  }
  
  export interface CTAButton {
    label: string;
    variant: 'default' | 'outline' | 'secondary';
    path: string;
    icon?: string;
  }
  
export interface HeroContent {
    headline: string;
    subheadline: string;
    description: string;
    buttons: CTAButton[];
    badge: string;
    avatarsLabel?: string;
    avatarsSubcopy?: string;
    avatarSuffix?: string;
    overlayTitle?: string;
    overlaySubtitle?: string;
  }
  
  export interface TrustIndicator {
    id: number;
    icon: string;
    label: string;
  }

export interface LandingContent {
  meta: {
    title: string;
    description: string;
    keywords?: string;
  };
  hero: HeroContent;
  featuresSection: {
    title: string;
    subtitle: string;
    learnMore: string;
    learnMoreAria: string;
    items: Feature[];
  };
  benefitsSection: {
    title: string;
    subtitle: string;
    items: Benefit[];
  };
  trust: {
    title: string;
    assurance: string;
    indicators: TrustIndicator[];
  };
  testimonialsSection: {
    title: string;
    subtitle: string;
    items: Testimonial[];
  };
  cta: {
    badge: string;
    title: string;
    description: string;
    primaryButton: CTAButton;
    stats: {
      usersValue: string;
      usersLabel: string;
      transactionsValue: string;
      transactionsLabel: string;
      ratingValue: string;
      ratingLabel: string;
    };
  };
  footer: {
    description: string;
    productTitle: string;
    companyTitle: string;
    legalTitle: string;
    productLinks: { label: string; href: string }[];
    companyLinks: { label: string; href: string }[];
    legalLinks: { label: string; href: string }[];
    bottom: {
      rights: string;
      encryption: string;
      insured: string;
    };
  };
}
