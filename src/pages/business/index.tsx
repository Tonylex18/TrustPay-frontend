import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Capability, Highlight, ServicePillar, Solution } from './types';

const BusinessPage: React.FC = () => {
  const navigate = useNavigate();

  const solutions: Solution[] = [
    {
      title: 'Working Capital & Treasury',
      description: 'Optimize liquidity with smart sweeps, secure deposits, and precise cash positioning built for operators.',
      icon: 'Banknote',
      tags: ['Liquidity', 'Treasury', 'RTP & Wires']
    },
    {
      title: 'Payments & Receivables',
      description: 'Straight-through processing for ACH, wires, RTP, and lockbox imaging so you get paid faster with fewer exceptions.',
      icon: 'Send',
      tags: ['ACH & RTP', 'Lockbox', 'Billing']
    },
    {
      title: 'Merchant & Ecommerce',
      description: 'Omnichannel acquiring with real-time fraud controls and clear settlement files for your finance stack.',
      icon: 'ShoppingBag',
      tags: ['Card', 'Checkout', 'Fraud']
    },
    {
      title: 'Payroll & Disbursements',
      description: 'Pay teams and suppliers anywhere with controlled approvals, audit trails, and FX-ready rails.',
      icon: 'Wallet',
      tags: ['Payroll', 'AP automation', 'Global-ready']
    }
  ];

  const highlights: Highlight[] = [
    {
      label: 'Funds availability',
      value: 'Same-day',
      description: 'RTP and wire rails with clear cutoff windows and proactive alerts.'
    },
    {
      label: 'Platform uptime',
      value: '99.95%',
      description: 'Redundant architecture and dual controls for critical payment paths.'
    },
    {
      label: 'Fraud monitoring',
      value: '24/7',
      description: 'Behavioral analytics with step-up authentication when risk spikes.'
    }
  ];

  const capabilities: Capability[] = [
    {
      title: 'Growth Capital',
      description: 'Credit lines, equipment finance, and SBA-friendly options aligned to your working capital cycle.',
      icon: 'Handshake',
      items: [
        'Flexible revolving and term structures',
        'Sector-aware pricing and covenants',
        'Scenario modeling with your relationship lead'
      ]
    },
    {
      title: 'Cash Management',
      description: 'Centralize balances, automate reconciliations, and keep approvals clean as you scale entities.',
      icon: 'Layers',
      items: [
        'Controlled disbursement and smart sweeps',
        'Positive pay with dual approvals',
        'APIs and file transfers for ERP connectivity'
      ]
    },
    {
      title: 'Advisory & Onboarding',
      description: 'Industry specialists who map your flows, connect systems, and get teams production-ready fast.',
      icon: 'Users',
      items: [
        'Playbooks for high-volume payables',
        'Connectivity guides for SFTP, APIs, and portals',
        'Training and change management for your staff'
      ]
    }
  ];

  const servicePillars: ServicePillar[] = [
    {
      title: 'Industry Depth',
      description: 'Dedicated coverage for manufacturing, logistics, healthcare, tech, and public sector.',
      icon: 'BarChart3',
      emphasis: 'Sector specialists'
    },
    {
      title: 'Control & Compliance',
      description: 'Role-based access, audit-grade approvals, and data retention aligned with SOC 2 controls.',
      icon: 'ShieldCheck',
      emphasis: 'Built-in governance'
    },
    {
      title: 'Human + Digital Support',
      description: 'Relationship teams plus 24/7 service desk and guided digital workflows.',
      icon: 'Headset',
      emphasis: '24/7 response'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Business Banking | TrustPay</title>
        <meta
          name="description"
          content="Business banking with treasury, payments, and industry specialists so you can run with confidence."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="bg-gradient-to-r from-[#d1202f]/90 via-[#d1202f] to-[#8b1b24] text-white">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  Business Banking
                </p>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  Capital, cash, and payments built for operators
                </h1>
                <p className="text-lg text-white/90">
                  Pair a dedicated relationship team with modern rails: RTP, wires, ACH, merchant acquiring,
                  and treasury controls that mirror how your business actually runs.
                </p>

                <div className="flex flex-wrap gap-3">
                  {['Treasury', 'Payments', 'Advisory', 'Security'].map((chip) => (
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
                    onClick={() => navigate('/registration')}
                  >
                    Open an account
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/60 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate('/commercial-banking')}
                  >
                    Talk to an advisor
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {highlights.map((item) => (
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
                  Core Solutions
                </p>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-3xl font-bold text-foreground">Everything you need to run and scale</h2>
                  <Button
                    variant="ghost"
                    className="text-primary hover:bg-primary/10"
                    onClick={() => navigate('/dashboard')}
                    iconName="ArrowRight"
                    iconPosition="right"
                  >
                    View cash position
                  </Button>
                </div>
                <p className="text-muted-foreground max-w-3xl">
                  Inspired by leading corporate banking playbooks, we combine deep expertise with modern
                  digital experiences so you can move money securely without slowing operations.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {solutions.map((solution) => (
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
                  Advisory-led approach
                </p>
                <h2 className="text-3xl font-bold text-foreground">
                  A partner who understands your operating model
                </h2>
                <p className="text-muted-foreground">
                  Borrow from the best parts of global commercial banking playbooks with the responsiveness of a
                  digital-first team. We map your flows, reduce friction, and keep controls tight.
                </p>
              </div>

              <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">
                {capabilities.map((capability) => (
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
                {servicePillars.map((pillar) => (
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
                  <p className="text-sm uppercase tracking-[0.3em] text-white/80">Let&apos;s talk</p>
                  <h3 className="text-2xl font-bold mt-2">Build your operating account plan with us</h3>
                  <p className="text-white/80 mt-2">
                    We&apos;ll map your payment flows, treasury needs, and industry nuances into a plan you can execute.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                    onClick={() => navigate('/commercial-banking#cib')}
                  >
                    Meet your banker
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/70 text-white hover:bg-white/10"
                    onClick={() => navigate('/about-trustpay')}
                  >
                    Why TrustPay
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
