import React from 'react';
import Icon from '../../../components/AppIcon';
import { Feature } from '../types';

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  return (
    <div className="group bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300">
      <div className="flex flex-col items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
          <Icon
            name={feature.icon}
            size={28}
            color="var(--color-primary)"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>

        <button
          className="flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all duration-300"
          aria-label={`Learn more about ${feature.title}`}
        >
          <span>Learn more</span>
          <Icon name="ArrowRight" size={16} />
        </button>
      </div>
    </div>
  );
};

export default FeatureCard;