import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../landing-page/components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Advisor, Insight, Offering, Strategy } from './types';

const InvestWealthManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const offerings: Offering[] = [
    {
      title: 'Personalized Portfolios',
      description: 'Curated allocations across public markets, alts, and cash with direct indexing options.',
      icon: 'PieChart',
      metrics: ['Direct indexing', 'Tax-aware', 'Multi-asset']
    },
    {
      title: 'Goals-Based Planning',
      description: 'Retirement, education, and liquidity planning with scenario analysis and stress tests.',
      icon: 'Target',
      metrics: ['Retirement', 'Education', 'Liquidity']
    },
    {
      title: 'Trust & Estate',
      description: 'Trust structures, philanthropy, and intergenerational strategies guided by specialists.',
      icon: 'Gem',
      metrics: ['Wealth transfer', 'Philanthropy', 'Trusts']
    },
    {
      title: 'Liquidity & Lending',
      description: 'Securities-backed lines, tailored mortgages, and strategic cash management.',
      icon: 'Banknote',
      metrics: ['Credit lines', 'Mortgages', 'Cash']
    }
  ];

  const strategies: Strategy[] = [
    {
      title: 'Research-driven perspective',
      detail: 'Investment committees monitoring macro, sector moves, and factor tilts to adapt quickly.',
      icon: 'BarChart3',
      highlight: 'Weekly market calls'
    },
    {
      title: 'Risk managed by design',
      detail: 'Scenario analysis, drawdown limits, and hedging overlays for concentrated positions.',
      icon: 'ShieldCheck',
      highlight: 'Downside guardrails'
    },
    {
      title: 'Advisory + Digital',
      detail: 'Dedicated advisors with intuitive digital views so you can act anywhere.',
      icon: 'Smartphone',
      highlight: 'Human + app'
    }
  ];

  const insights: Insight[] = [
    {
      title: '2024 Market Playbook',
      summary: 'How we are positioning across quality equities, short-duration credit, and real assets.',
      category: 'Market View'
    },
    {
      title: 'Planning for Liquidity Events',
      summary: 'Pre-transaction planning, QSBS considerations, and charitable timing strategies.',
      category: 'Wealth Strategy'
    },
    {
      title: 'Navigating Higher Rates',
      summary: 'Laddering cash, refinancing opportunities, and hedging rate exposure on debt.',
      category: 'Insights'
    }
  ];

  const advisors: Advisor[] = [
    { name: 'Evelyn Carter', focus: 'Families & Founders', credential: 'CFA, CFP' },
    { name: 'Marcus Reid', focus: 'Executives & Equity Comp', credential: 'CRPC, CEP' },
    { name: 'Sophia Lee', focus: 'Liquidity & Lending', credential: 'Wealth Specialist' }
  ];

  return (
    <>
      <Helmet>
        <title>Investing & Wealth Management | TrustPay</title>
        <meta
          name="description"
          content="Advisory-led investing, wealth planning, and lending solutions inspired by leading corporate investment banks."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="bg-gradient-to-br from-[#d1202f] via-[#e74232] to-[#f6c33d] text-white">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  Investing & Wealth
                </p>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                  A wealth platform with capital markets DNA
                </h1>
                <p className="text-lg text-white/90">
                  Portfolios, planning, and lending that blend the rigor of institutional desks with the care of a
                  dedicated wealth team.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    size="lg"
                    className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                    onClick={() => navigate('/registration')}
                  >
                    Start planning
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/70 text-white hover:text-white hover:bg-white/10"
                    onClick={() => navigate('/commercial-banking')}
                  >
                    Talk to an advisor
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {strategies.map((strategy) => (
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
                  Offerings
                </p>
                <h2 className="text-3xl font-bold text-foreground">Tailored wealth strategies</h2>
                <p className="text-muted-foreground max-w-3xl">
                  Inspired by leading institutional platforms, delivered through personal relationships and intuitive
                  tools.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {offerings.map((offering) => (
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
                  Insights & Research
                </p>
                <h2 className="text-3xl font-bold text-foreground">Stay ahead with our point of view</h2>
                <p className="text-muted-foreground">
                  Weekly research, market notes, and planning prompts so you can take action with confidence.
                </p>
                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/10 w-fit"
                  iconName="ArrowRight"
                  iconPosition="right"
                  onClick={() => navigate('/about-trustpay')}
                >
                  See how we think
                </Button>
              </div>

              <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                {insights.map((insight) => (
                  <div key={insight.title} className="bg-card border border-border rounded-2xl p-5 shadow-card">
                    <div className="text-xs uppercase tracking-wide text-[#d1202f] font-semibold">
                      {insight.category}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mt-2">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary font-semibold">
                      <span>Read more</span>
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
                  Dedicated Advisors
                </p>
                <h2 className="text-3xl font-bold text-foreground">A team aligned to your goals</h2>
                <p className="text-muted-foreground">
                  Work with seasoned advisors backed by planning, lending, and investment specialists.
                </p>

                <div className="space-y-3">
                  {advisors.map((advisor) => (
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
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">Ready when you are</p>
                <h3 className="text-2xl font-bold mt-2">Let&apos;s design your plan</h3>
                <p className="text-white/80 mt-2">
                  We&apos;ll align on goals, risk, liquidity needs, and build a roadmap you can track in the app.
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    className="bg-white text-[#8b1b24] hover:bg-white/90 border-none"
                    onClick={() => navigate('/business')}
                  >
                    Connect with us
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/70 text-white hover:bg-white/10"
                    onClick={() => navigate('/dashboard')}
                  >
                    View portfolios
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
