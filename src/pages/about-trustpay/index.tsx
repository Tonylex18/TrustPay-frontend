import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Metric, Milestone, Value } from './types';

const AboutTrustPayPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('about');

  const metrics = t('hero.metrics', { returnObjects: true }) as Metric[];
  const values = t('principles.values', { returnObjects: true }) as Value[];
  const milestones = t('milestones.items', { returnObjects: true }) as Milestone[];

  return (
    <>
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="bg-gradient-to-r from-[#d1202f]/95 via-[#d1202f] to-[#7d1420] text-white">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  {t('hero.eyebrow')}
                </p>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  {t('hero.title')}
                </h1>
                <p className="text-lg text-white/90">
                  {t('hero.description')}
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    size="lg"
                    className="bg-white text-[#7d1420] hover:bg-white/90 border-none"
                    onClick={() => navigate(t('hero.ctaPrimary.path'))}
                  >
                    {t('hero.ctaPrimary.label')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/70 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate(t('hero.ctaSecondary.path'))}
                  >
                    {t('hero.ctaSecondary.label')}
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur">
                    <p className="text-sm text-white/80">{metric.label}</p>
                    <p className="text-2xl font-semibold mt-1">{metric.value}</p>
                    <p className="text-sm text-white/80 mt-2">{metric.detail}</p>
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
                  {t('principles.eyebrow')}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{t('principles.title')}</h2>
                <p className="text-muted-foreground max-w-3xl">{t('principles.description')}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value) => (
                  <div
                    key={value.title}
                    className="border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow bg-white"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center mb-3">
                      <Icon name={value.icon} size={22} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-muted">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#d1202f] uppercase tracking-wide">
                  {t('milestones.eyebrow')}
                </p>
                <h2 className="text-3xl font-bold text-foreground">{t('milestones.title')}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {milestones.map((milestone) => (
                  <div key={milestone.year} className="bg-card border border-border rounded-2xl p-5 shadow-card flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#d1202f]/10 text-[#d1202f] flex items-center justify-center text-lg font-bold">
                      {milestone.year}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto bg-gradient-to-r from-[#d1202f] to-[#b71b24] text-white rounded-2xl p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">{t('cta.eyebrow')}</p>
                <h3 className="text-2xl font-bold mt-2">{t('cta.title')}</h3>
                <p className="text-white/80 mt-2">{t('cta.description')}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                  onClick={() => navigate(t('cta.primary.path'))}
                >
                  {t('cta.primary.label')}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/70 text-white hover:bg-white/10"
                  onClick={() => navigate(t('cta.secondary.path'))}
                >
                  {t('cta.secondary.label')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutTrustPayPage;
