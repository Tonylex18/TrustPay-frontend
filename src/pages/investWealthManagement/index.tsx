import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { InvestContent } from './types';

const InvestWealthManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('invest');

  const content = useMemo(
    () =>
      ({
        meta: t('meta', { returnObjects: true }),
        hero: t('hero', { returnObjects: true }),
        offerings: t('offerings', { returnObjects: true }),
        insights: t('insights', { returnObjects: true }),
        advisors: t('advisors', { returnObjects: true }),
        cta: t('cta', { returnObjects: true })
      }) as InvestContent,
    [t]
  );

  return (
    <>
      <Helmet>
        <title>{content.meta.title}</title>
        <meta
          name="description"
          content={content.meta.description}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="bg-gradient-to-br from-[#d1202f] via-[#e74232] to-[#f6c33d] text-white">
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
                <div className="flex gap-4 flex-wrap">
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
                    className="border-white/70 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate(content.hero.ctaSecondary.path)}
                  >
                    {content.hero.ctaSecondary.label}
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {content.hero.strategies.map((strategy) => (
                  <div key={strategy.title} className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                        <Icon name={strategy.icon} size={18} color="white" />
                      </div>
                      <div className="text-xs uppercase tracking-wide text-white/80">
                        {strategy.highlight}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mt-2">{strategy.title}</h3>
                    <p className="text-sm text-white/80 mt-1">{strategy.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-card">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {content.offerings.eyebrow}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{content.offerings.title}</h2>
                <p className="text-muted-foreground max-w-3xl">
                  {content.offerings.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {content.offerings.items.map((offering) => (
                  <div
                    key={offering.title}
                    className="border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow bg-white flex flex-col gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center">
                      <Icon name={offering.icon} size={22} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{offering.title}</h3>
                    <p className="text-sm text-muted-foreground">{offering.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {offering.metrics?.map((metric) => (
                        <span
                          key={metric}
                          className="px-2 py-1 rounded-full bg-muted text-[12px] font-semibold text-foreground"
                        >
                          {metric}
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
                  {content.insights.eyebrow}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{content.insights.title}</h2>
                <p className="text-muted-foreground">
                  {content.insights.description}
                </p>
                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/10 w-fit"
                  iconName="ArrowRight"
                  iconPosition="right"
                  onClick={() => navigate(content.insights.cta.path)}
                >
                  {content.insights.cta.label}
                </Button>
              </div>

              <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                {content.insights.items.map((insight) => (
                  <div key={insight.title} className="bg-card border border-border rounded-2xl p-5 shadow-card">
                    <div className="text-xs uppercase tracking-wide text-[#d1202f] font-semibold">
                      {insight.category}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mt-2">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary font-semibold">
                      <span>{content.insights.readMore}</span>
                      <Icon name="ArrowUpRight" size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {content.advisors.eyebrow}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{content.advisors.title}</h2>
                <p className="text-muted-foreground">
                  {content.advisors.description}
                </p>

                <div className="space-y-3">
                  {content.advisors.people.map((advisor) => (
                    <div key={advisor.name} className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border">
                        <Icon name="User" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{advisor.name}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{advisor.focus}</p>
                        <p className="text-sm text-muted-foreground mt-1">{advisor.credential}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#d1202f] to-[#b71b24] text-white rounded-2xl p-8 shadow-card">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">{content.cta.eyebrow}</p>
                <h3 className="text-2xl font-bold mt-2">{content.cta.title}</h3>
                <p className="text-white/80 mt-2">
                  {content.cta.description}
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                    onClick={() => navigate(content.cta.primary.path)}
                  >
                    {content.cta.primary.label}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/70 text-white hover:bg-white/10"
                    onClick={() => navigate(content.cta.secondary.path)}
                  >
                    {content.cta.secondary.label}
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

export default InvestWealthManagementPage;
