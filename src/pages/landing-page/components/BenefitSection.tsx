import React from 'react';
import Icon from '../../../components/AppIcon';
import { Benefit } from '../types';

interface BenefitSectionProps {
  benefits: Benefit[];
  title: string;
  subtitle: string;
}

const BenefitSection = ({ benefits, title, subtitle }: BenefitSectionProps) => {
  return (
    <section className="bg-muted/30 py-16 lg:py-24">
      <div className="px-nav-margin">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Icon
                      name={benefit.icon}
                      size={24}
                      color="var(--color-success)"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {benefit.title}
                      </h3>
                      {benefit.badge && (
                        <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                          {benefit.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitSection;
