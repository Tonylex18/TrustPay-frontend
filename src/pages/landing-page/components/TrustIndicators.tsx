import React from 'react';
import Icon from '../../../components/AppIcon';
import { TrustIndicator } from '../types';

interface TrustIndicatorsProps {
  indicators: TrustIndicator[];
  title: string;
  assurance: string;
}

const TrustIndicators = ({ indicators, title, assurance }: TrustIndicatorsProps) => {
  return (
    <section className="bg-card border-y border-border py-8">
      <div className="px-nav-margin">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={24} color="var(--color-success)" />
              <span className="text-sm font-medium text-foreground">
                {title}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8">
              {indicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-300"
                >
                  <Icon
                    name={indicator.icon}
                    size={20}
                    color="var(--color-muted-foreground)"
                  />
                  <span className="text-sm text-muted-foreground">
                    {indicator.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
              <Icon name="CheckCircle" size={16} color="var(--color-success)" />
              <span className="text-sm font-medium text-success">
                {assurance}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
