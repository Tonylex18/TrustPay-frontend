import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { BusinessContent } from './types';

const BusinessPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('business');

  const content = useMemo(
    () =>
      ({
        meta: t('meta', { returnObjects: true }),
        hero: t('hero', { returnObjects: true }),
        solutions: t('solutions', { returnObjects: true }),
        advisory: t('advisory', { returnObjects: true }),
        service: t('service', { returnObjects: true })
      }) as BusinessContent,
    [t]
  );

  return (
    <>
      <Helmet>
        <title>{content.meta.title}</title>
        <meta name="description" content={content.meta.description} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="bg-gradient-to-r from-[#d1202f]/90 via-[#d1202f] to-[#8b1b24] text-white">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  {content.hero.eyebrow}
                </p>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  {content.hero.title}
                </h1>
                <p className="text-lg text-white/90">
                  {content.hero.description}
                </p>

                <div className="flex flex-wrap gap-3">
                  {content.hero.chips.map((chip) => (
                    <span
                      key={chip}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                    onClick={() => navigate(content.hero.ctaPrimary.path)}
                  >
                    {content.hero.ctaPrimary.label}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/60 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate(content.hero.ctaSecondary.path)}
                  >
                    {content.hero.ctaSecondary.label}
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {content.hero.highlights.map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur"
                  >
                    <p className="text-sm text-white/80">{item.label}</p>
                    <p className="text-2xl font-semibold mt-1">{item.value}</p>
                    <p className="text-sm text-white/80 mt-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {content.solutions.eyebrow}
                </p>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-3xl font-bold text-foreground">{content.solutions.title}</h2>
                  <Button
                    variant="ghost"
                    className="text-primary hover:bg-primary/10"
                    onClick={() => navigate(content.solutions.cta.path)}
                    iconName="ArrowRight"
                    iconPosition="right"
                  >
                    {content.solutions.cta.label}
                  </Button>
                </div>
                <p className="text-muted-foreground max-w-3xl">
                  {content.solutions.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {content.solutions.items.map((solution) => (
                  <div
                    key={solution.title}
                    className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center mb-4">
                      <Icon name={solution.icon} size={22} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{solution.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{solution.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {solution.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-muted text-[12px] font-semibold text-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-muted">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {content.advisory.eyebrow}
                </p>
                <h2 className="text-3xl font-bold text-foreground">
                  {content.advisory.title}
                </h2>
                <p className="text-muted-foreground">
                  {content.advisory.description}
                </p>
              </div>

              <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">
                {content.advisory.capabilities.map((capability) => (
                  <div
                    key={capability.title}
                    className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center">
                        <Icon name={capability.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{capability.title}</h3>
                        <p className="text-sm text-muted-foreground">{capability.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {capability.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Icon name="CheckCircle" size={16} className="mt-0.5 text-success" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {content.service.pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center">
                        <Icon name={pillar.icon} size={18} />
                      </div>
                      <div className="text-xs font-semibold text-[#d1202f] uppercase tracking-wide">
                        {pillar.emphasis}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{pillar.title}</h3>
                    <p className="text-muted-foreground">{pillar.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#d1202f] to-[#b71b24] text-white rounded-2xl mt-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/80">{content.service.cta.eyebrow}</p>
                  <h3 className="text-2xl font-bold mt-2">{content.service.cta.title}</h3>
                  <p className="text-white/80 mt-2">
                    {content.service.cta.description}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                    onClick={() => navigate(content.service.cta.primary.path)}
                  >
                    {content.service.cta.primary.label}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/70 text-white hover:bg-white/10"
                    onClick={() => navigate(content.service.cta.secondary.path)}
                  >
                    {content.service.cta.secondary.label}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BusinessPage;
