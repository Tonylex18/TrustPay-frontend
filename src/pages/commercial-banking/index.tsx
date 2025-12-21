import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Advisor, Industry, Insight, Offering } from './types';

const CommercialBankingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const offerings: Offering[] = [
    {
      title: 'Capital Markets & Advisory',
      description: 'Debt, equity, and M&A guidance with execution teams that know your board agenda.',
      icon: 'LineChart',
      badges: ['Capital Markets', 'M&A', 'Private placements']
    },
    {
      title: 'Treasury & Payments',
      description: 'Global cash management with RTP, wires, controlled disbursement, and receivables automation.',
      icon: 'Banknote',
      badges: ['Treasury', 'Payment Rails', 'AP/AR']
    },
    {
      title: 'Risk & Liquidity',
      description: 'FX, interest-rate, and commodity strategies so you protect margin while you scale.',
      icon: 'Shield',
      badges: ['FX', 'Rates', 'Hedging']
    },
    {
      title: 'Sector Coverage',
      description: 'Coverage bankers and product specialists with deep sector fluency and market intelligence.',
      icon: 'Briefcase',
      badges: ['Board-ready insights', 'Playbooks', 'Benchmarking']
    }
  ];

  const industries: Industry[] = [
    {
      name: 'Technology & Media',
      focus: 'Usage-based billing, platform payouts, and subscription cash cycles.',
      icon: 'Cpu'
    },
    {
      name: 'Healthcare & Life Sciences',
      focus: 'Provider reimbursements, research funding, and clinical trial disbursements.',
      icon: 'HeartPulse'
    },
    {
      name: 'Industrial & Manufacturing',
      focus: 'Capex planning, inventory financing, and global supply-chain flows.',
      icon: 'Factory'
    },
    {
      name: 'Energy & Renewables',
      focus: 'Project finance, power purchase agreements, and commodity hedging.',
      icon: 'Sun'
    },
    {
      name: 'Public Sector & Education',
      focus: 'Bond issuance, escrow, and transparent disbursements for constituents.',
      icon: 'GraduationCap'
    },
    {
      name: 'Real Estate & Hospitality',
      focus: 'Construction draws, deposits, and touchless guest experiences.',
      icon: 'Building2'
    }
  ];

  const insights: Insight[] = [
    {
      title: 'Execution-ready teams',
      detail: 'Deal, treasury, and credit leads aligned to your growth and liquidity plans.',
      icon: 'Users'
    },
    {
      title: 'Connectivity by design',
      detail: 'APIs and secure file transfers to your ERP, treasury workstation, and data warehouse.',
      icon: 'Globe2'
    },
    {
      title: 'Risk managed in real time',
      detail: 'Pre-transaction checks, dual approvals, and surveillance that reduces operational risk.',
      icon: 'ShieldCheck'
    }
  ];

  const advisors: Advisor[] = [
    { name: 'Amelia Grant', region: 'National Coverage', specialty: 'CIB - Industrials & Services', icon: 'User' },
    { name: 'Victor Lin', region: 'West & APAC corridor', specialty: 'Technology, platforms, cross-border', icon: 'User' },
    { name: 'Priya Desai', region: 'East & LATAM corridor', specialty: 'Energy transition, consumer, fintech', icon: 'User' }
  ];

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
        <title>Commercial & Investment Banking | TrustPay</title>
        <meta
          name="description"
          content="Industry-focused commercial banking with capital markets access, treasury expertise, and always-on risk management."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section id="commercial-banking" className="bg-gradient-to-r from-[#d1202f]/95 via-[#d1202f] to-[#7d1420] text-white">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  Commercial Banking
                </p>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  Bank with the confidence of a capital markets partner
                </h1>
                <p className="text-lg text-white/90">
                  Inspired by the best of corporate and investment banking, TrustPay delivers the coverage,
                  product depth, and digital rails you need to move quickly in every market.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    size="lg"
                    className="bg-white text-[#7d1420] hover:bg-white/90 border-none"
                    onClick={() => navigate('/registration')}
                  >
                    Get started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/60 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate('/commercial-banking#cib')}
                  >
                    Explore CIB coverage
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {['Capital', 'Liquidity', 'Risk'].map((item) => (
                  <div
                    key={item}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur text-center"
                  >
                    <p className="text-sm text-white/80">Priority</p>
                    <p className="text-2xl font-semibold mt-1">{item}</p>
                    <p className="text-sm text-white/70 mt-2">
                      Board-ready reporting, approvals, and execution pathways.
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
                  Corporate & Investment Banking
                </p>
                <h2 className="text-3xl font-bold text-foreground">Advisory teams with product depth</h2>
                <p className="text-muted-foreground max-w-3xl">
                  Capital markets access, treasury excellence, and always-on surveillance—delivered by industry
                  specialists working as one team.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {offerings.map((offering) => (
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
                  Industry Coverage
                </p>
                <h2 className="text-3xl font-bold text-foreground">Teams built around your sector</h2>
                <p className="text-muted-foreground max-w-3xl">
                  From technology to public sector, we bring nuanced coverage models, specialized underwriting,
                  and payment flows tuned to your customers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {industries.map((industry) => (
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
                  Execution Support
                </p>
                <h2 className="text-3xl font-bold text-foreground">What you get with TrustPay</h2>
                <p className="text-muted-foreground">
                  We blend product depth with responsive service so you can focus on the next milestone—funding,
                  expansion, or liquidity.
                </p>

                <div className="space-y-3">
                  {insights.map((insight) => (
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
                    <p className="text-sm uppercase tracking-[0.3em] text-[#d1202f]">Coverage</p>
                    <h3 className="text-2xl font-bold text-foreground">Talk with a lead banker</h3>
                    <p className="text-muted-foreground mt-1">
                      Choose the corridor and specialty that fits your roadmap.
                    </p>
                  </div>
                  <Icon name="PhoneCall" size={32} className="text-[#d1202f]" />
                </div>

                <div className="mt-6 space-y-4">
                  {advisors.map((advisor) => (
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
                    onClick={() => navigate('/business')}
                  >
                    See operating accounts
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                    onClick={() => navigate('/about-trustpay')}
                  >
                    Learn about TrustPay
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
