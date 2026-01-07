import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import HeroSection from './components/HeroSection';
import Header from './components/Header';
import FeatureCard from './components/FeatureCard';
import BenefitSection from './components/BenefitSection';
import TrustIndicators from './components/TrustIndicators';
import TestimonialCard from './components/TestimonialCard';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { HeroContent, LandingContent } from './types';

const LandingPage = () => {
  const { t } = useTranslation('landing');

  const landingContent = useMemo(
    () =>
      ({
        meta: t('meta', { returnObjects: true }),
        hero: t('hero', { returnObjects: true }),
        featuresSection: t('featuresSection', { returnObjects: true }),
        benefitsSection: t('benefitsSection', { returnObjects: true }),
        trust: t('trust', { returnObjects: true }),
        testimonialsSection: t('testimonialsSection', { returnObjects: true }),
        cta: t('cta', { returnObjects: true }),
        footer: t('footer', { returnObjects: true })
      }) as LandingContent,
    [t]
  );

  const heroContent: HeroContent = landingContent.hero;
  const { featuresSection, benefitsSection, trust, testimonialsSection, cta, footer, meta } = landingContent;

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection content={heroContent} />

        <TrustIndicators
          indicators={trust.indicators.map((indicator, index) => ({ ...indicator, id: index + 1 }))}
          title={trust.title}
          assurance={trust.assurance}
        />

        <section className="py-16 lg:py-24">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {featuresSection.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {featuresSection.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuresSection.items.map((feature, index) => (
                  <FeatureCard
                    key={`${feature.title}-${index}`}
                    feature={{ ...feature, id: index + 1 }}
                    ctaLabel={featuresSection.learnMore}
                    ctaAria={featuresSection.learnMoreAria.replace('{{title}}', feature.title)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <BenefitSection
          benefits={benefitsSection.items.map((benefit, index) => ({ ...benefit, id: index + 1 }))}
          title={benefitsSection.title}
          subtitle={benefitsSection.subtitle}
        />

        <section className="py-16 lg:py-24 bg-background">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {testimonialsSection.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {testimonialsSection.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonialsSection.items.map((testimonial, index) => (
                  <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={{ ...testimonial, id: index + 1 }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <CTASection content={cta} />

        <Footer content={footer} />
      </div>
    </>);

};

export default LandingPage;
