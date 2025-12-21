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
