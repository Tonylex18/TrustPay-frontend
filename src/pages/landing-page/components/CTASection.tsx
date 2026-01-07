import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { CTAButton } from '../types';

type CTAContent = {
  badge: string;
  title: string;
  description: string;
  primaryButton: CTAButton;
  stats: {
    usersValue: string;
    usersLabel: string;
    transactionsValue: string;
    transactionsLabel: string;
    ratingValue: string;
    ratingLabel: string;
  };
};

type Props = {
  content: CTAContent;
};

const CTASection = ({ content }: Props) => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 py-16 lg:py-24">
      <div className="px-nav-margin">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Icon name="Sparkles" size={16} color="white" />
            <span className="text-sm font-medium text-white">
              {content.badge}
            </span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            {content.title}
          </h2>

          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {content.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant={content.primaryButton.variant}
              size="lg"
              onClick={() => navigate(content.primaryButton.path)}
              iconName={content.primaryButton.icon as any}
              iconPosition="right"
              className="min-w-[200px]"
            >
              {content.primaryButton.label}
            </Button>
            {/* <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              iconName="ArrowRight"
              iconPosition="right"
              className="min-w-[200px] bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              View Demo
            </Button> */}
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{content.stats.usersValue}</p>
              <p className="text-sm text-white/80">{content.stats.usersLabel}</p>
            </div>
            <div className="w-px h-12 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{content.stats.transactionsValue}</p>
              <p className="text-sm text-white/80">{content.stats.transactionsLabel}</p>
            </div>
            <div className="w-px h-12 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{content.stats.ratingValue}</p>
              <p className="text-sm text-white/80">{content.stats.ratingLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
