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
