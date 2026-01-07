export interface Solution {
  title: string;
  description: string;
  icon: string;
  tags: string[];
}

export interface Capability {
  title: string;
  description: string;
  icon: string;
  items: string[];
}

export interface Highlight {
  label: string;
  value: string;
  description: string;
}

export interface ServicePillar {
  title: string;
  description: string;
  icon: string;
  emphasis?: string;
}

export interface BusinessContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    chips: string[];
    ctaPrimary: { label: string; path: string };
    ctaSecondary: { label: string; path: string };
    highlights: Highlight[];
  };
  solutions: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: { label: string; path: string };
    items: Solution[];
  };
  advisory: {
    eyebrow: string;
    title: string;
    description: string;
    capabilities: Capability[];
  };
  service: {
    pillars: ServicePillar[];
    cta: {
      eyebrow: string;
      title: string;
      description: string;
      primary: { label: string; path: string };
      secondary: { label: string; path: string };
    };
  };
}
