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
