import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { CommercialContent } from './types';

const CommercialBankingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('commercial');

  const content = useMemo(
    () =>
      ({
        meta: t('meta', { returnObjects: true }),
        hero: t('hero', { returnObjects: true }),
        offerings: t('offerings', { returnObjects: true }),
        industries: t('industries', { returnObjects: true }),
        execution: t('execution', { returnObjects: true })
      }) as CommercialContent,
    [t]
  );

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location]);

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

        <section id="commercial-banking" className="bg-gradient-to-r from-[#d1202f]/95 via-[#d1202f] to-[#7d1420] text-white">
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
                    className="bg-white text-[#7d1420] hover:bg-white/90 border-none"
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
                {content.hero.priorities.map((item) => (
                  <div
                    key={item.value}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur text-center"
                  >
                    <p className="text-sm text-white/80">{item.label}</p>
                    <p className="text-2xl font-semibold mt-1">{item.value}</p>
                    <p className="text-sm text-white/70 mt-2">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="cib" className="py-16 lg:py-20 bg-card">
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
                    className="border border-border rounded-2xl p-5 bg-white shadow-card hover:shadow-card-hover transition-shadow flex flex-col gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center">
                      <Icon name={offering.icon} size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{offering.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{offering.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {offering.badges?.map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-1 bg-muted text-[12px] font-semibold rounded-full text-foreground"
                        >
                          {badge}
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
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {content.industries.eyebrow}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{content.industries.title}</h2>
                <p className="text-muted-foreground max-w-3xl">
                  {content.industries.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.industries.items.map((industry) => (
                  <div
                    key={industry.name}
                    className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow flex gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center flex-shrink-0">
                      <Icon name={industry.icon} size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{industry.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{industry.focus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {content.execution.eyebrow}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{content.execution.title}</h2>
                <p className="text-muted-foreground">
                  {content.execution.description}
                </p>

                <div className="space-y-3">
                  {content.execution.insights.map((insight) => (
                    <div key={insight.title} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center flex-shrink-0">
                        <Icon name={insight.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground">{insight.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#d1202f]">{content.execution.coverage.eyebrow}</p>
                    <h3 className="text-2xl font-bold text-foreground">{content.execution.coverage.title}</h3>
                    <p className="text-muted-foreground mt-1">
                      {content.execution.coverage.description}
                    </p>
                  </div>
                  <Icon name="PhoneCall" size={32} className="text-[#d1202f]" />
                </div>

                <div className="mt-6 space-y-4">
                  {content.execution.coverage.advisors.map((advisor) => (
                    <div key={advisor.name} className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border">
                        <Icon name={advisor.icon} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{advisor.name}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{advisor.region}</p>
                        <p className="text-sm text-muted-foreground mt-1">{advisor.specialty}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    className="bg-[#d1202f] text-white hover:bg-[#b71b24]"
                    onClick={() => navigate(content.execution.coverage.ctaPrimary.path)}
                  >
                    {content.execution.coverage.ctaPrimary.label}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                    onClick={() => navigate(content.execution.coverage.ctaSecondary.path)}
                  >
                    {content.execution.coverage.ctaSecondary.label}
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

export default CommercialBankingPage;
