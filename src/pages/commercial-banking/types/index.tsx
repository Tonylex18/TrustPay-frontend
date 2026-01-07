export interface Offering {
  title: string;
  description: string;
  icon: string;
  badges?: string[];
}

export interface Industry {
  name: string;
  focus: string;
  icon: string;
}

export interface Insight {
  title: string;
  detail: string;
  icon: string;
}

export interface Advisor {
  name: string;
  region: string;
  specialty: string;
  icon: string;
}

export interface CommercialContent {
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
    priorities: { label: string; value: string; description: string }[];
  };
  offerings: {
    eyebrow: string;
    title: string;
    description: string;
    items: Offering[];
  };
  industries: {
    eyebrow: string;
    title: string;
    description: string;
    items: Industry[];
  };
  execution: {
    eyebrow: string;
    title: string;
    description: string;
    insights: Insight[];
    coverage: {
      eyebrow: string;
      title: string;
      description: string;
      advisors: Advisor[];
      ctaPrimary: { label: string; path: string };
      ctaSecondary: { label: string; path: string };
    };
  };
}
