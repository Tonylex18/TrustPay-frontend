export interface Offering {
  title: string;
  description: string;
  icon: string;
  metrics?: string[];
}

export interface Strategy {
  title: string;
  detail: string;
  icon: string;
  highlight?: string;
}

export interface Insight {
  title: string;
  summary: string;
  category: string;
}

export interface Advisor {
  name: string;
  focus: string;
  credential: string;
}

export interface InvestContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    ctaPrimary: { label: string; path: string };
    ctaSecondary: { label: string; path: string };
    strategies: Strategy[];
  };
  offerings: {
    eyebrow: string;
    title: string;
    description: string;
    items: Offering[];
  };
  insights: {
    eyebrow: string;
    title: string;
    description: string;
    cta: { label: string; path: string };
    readMore: string;
    items: Insight[];
  };
  advisors: {
    eyebrow: string;
    title: string;
    description: string;
    people: Advisor[];
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    primary: { label: string; path: string };
    secondary: { label: string; path: string };
  };
}
