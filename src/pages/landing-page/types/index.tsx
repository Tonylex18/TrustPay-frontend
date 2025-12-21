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
  }
  
  export interface TrustIndicator {
    id: number;
    icon: string;
    label: string;
  }