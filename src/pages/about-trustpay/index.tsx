import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Metric, Milestone, Value } from './types';

const AboutTrustPayPage: React.FC = () => {
  const navigate = useNavigate();

  const metrics: Metric[] = [
    { label: 'Clients served', value: '50K+', detail: 'From startups to middle-market leaders trusting TrustPay.' },
    { label: 'Availability', value: '99.95%', detail: 'Redundant, monitored, and built for always-on banking.' },
    { label: 'Protected transfers', value: '$12B+', detail: 'Processed annually with layered fraud defenses.' }
  ];

  const values: Value[] = [
    {
      title: 'Trust-first Security',
      description: 'Defense-in-depth, SOC 2 alignment, and role-based controls across every workflow.',
      icon: 'ShieldCheck'
    },
    {
      title: 'People + Platform',
      description: 'Dedicated teams plus intuitive experiences so you can move quickly without sacrificing control.',
      icon: 'Users'
    },
    {
      title: 'Transparency',
      description: 'Clear pricing, clear settlement times, and proactive communication when things change.',
      icon: 'Sparkles'
    }
  ];

  const milestones: Milestone[] = [
    { year: '2018', title: 'TrustPay launches', detail: 'Built to make modern treasury and payments accessible to every business.' },
    { year: '2020', title: 'Real-time rails', detail: 'Introduced RTP and faster onboarding with guided controls.' },
    { year: '2022', title: 'Commercial banking suite', detail: 'Expanded coverage teams and introduced advanced treasury APIs.' },
    { year: '2024', title: 'Wealth & advisory', detail: 'Brought capital markets-inspired wealth planning to clients.' }
  ];

  return (
    <>
      <Helmet>
        <title>About TrustPay | Who We Are</title>
        <meta
          name="description"
          content="Learn about TrustPay’s mission, security-first approach, and the teams powering modern banking experiences."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="bg-gradient-to-r from-[#d1202f]/95 via-[#d1202f] to-[#7d1420] text-white">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  About TrustPay
                </p>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  Banking built on trust, with the rigor of leading corporate banks
                </h1>
                <p className="text-lg text-white/90">
                  We combine secure infrastructure, human expertise, and transparent service so you can operate with
                  confidence—whether you are scaling fast or stewarding generations of wealth.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    size="lg"
                    className="bg-white text-[#7d1420] hover:bg-white/90 border-none"
                    onClick={() => navigate('/registration')}
                  >
                    Join TrustPay
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/70 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate('/business')}
                  >
                    Explore solutions
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
                  What we stand for
                </p>
                <h2 className="text-3xl font-bold text-foreground">Principles that guide every decision</h2>
                <p className="text-muted-foreground max-w-3xl">
                  From how we secure your data to how we staff our teams, our values keep us accountable to you.
                </p>
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
                  Our path
                </p>
                <h2 className="text-3xl font-bold text-foreground">Milestones that shaped TrustPay</h2>
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
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">Next Steps</p>
                <h3 className="text-2xl font-bold mt-2">Let&apos;s build what you need</h3>
                <p className="text-white/80 mt-2">
                  Whether you need corporate banking, wealth planning, or payment modernization, we&apos;re ready to help.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                  onClick={() => navigate('/commercial-banking')}
                >
                  Talk with us
                </Button>
                <Button
                  variant="outline"
                  className="border-white/70 text-white hover:bg-white/10"
                  onClick={() => navigate('/dashboard')}
                >
                  Explore the app
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
