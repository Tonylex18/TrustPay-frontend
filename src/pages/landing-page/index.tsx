import React from 'react';
import { Helmet } from 'react-helmet';
import HeroSection from './components/HeroSection';
import Header from './components/Header';
import FeatureCard from './components/FeatureCard';
import BenefitSection from './components/BenefitSection';
import TrustIndicators from './components/TrustIndicators';
import TestimonialCard from './components/TestimonialCard';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { HeroContent, Feature, Benefit, TrustIndicator, Testimonial } from './types';

const LandingPage = () => {
  const heroContent: HeroContent = {
    headline: "Trusted by 50,000+ Users",
    subheadline: "Banking That Works For You",
    description: "Experience seamless digital banking with enterprise-grade security, instant transfers, and 24/7 account access. Manage your finances smarter with TrustPay.",
    buttons: [
    {
      label: "Get Started Free",
      variant: "default",
      path: "/registration",
      icon: "ArrowRight"
    },
    {
      label: "Sign In",
      variant: "outline",
      path: "/dashboard"
    }]

  };

  const features: Feature[] = [
  {
    id: 1,
    icon: "Zap",
    title: "Instant Transfers",
    description: "Send and receive money instantly with zero fees. Transfer funds to any account within seconds using our secure platform."
  },
  {
    id: 2,
    icon: "Shield",
    title: "Bank-Level Security",
    description: "Your data is protected with 256-bit encryption, two-factor authentication, and real-time fraud monitoring systems."
  },
  {
    id: 3,
    icon: "Smartphone",
    title: "Mobile First Design",
    description: "Access your accounts anywhere, anytime. Our responsive platform works seamlessly across all devices."
  },
  {
    id: 4,
    icon: "CreditCard",
    title: "Smart Card Management",
    description: "Control your cards with instant freeze/unfreeze, spending limits, and real-time transaction notifications."
  },
  {
    id: 5,
    icon: "PieChart",
    title: "Financial Insights",
    description: "Track spending patterns, set budgets, and receive personalized financial recommendations powered by AI."
  },
  {
    id: 6,
    icon: "Headphones",
    title: "24/7 Support",
    description: "Get help whenever you need it with our round-the-clock customer support team and comprehensive help center."
  }];


  const benefits: Benefit[] = [
  {
    id: 1,
    icon: "Lock",
    title: "Advanced Security",
    description: "Multi-layer security with biometric authentication, device recognition, and real-time fraud detection to keep your money safe.",
    badge: "Verified"
  },
  {
    id: 2,
    icon: "Zap",
    title: "Lightning Fast",
    description: "Experience instant transactions, real-time balance updates, and seamless account management with our optimized platform.",
    badge: "Fast"
  },
  {
    id: 3,
    icon: "DollarSign",
    title: "Zero Hidden Fees",
    description: "Transparent pricing with no monthly maintenance fees, no minimum balance requirements, and free unlimited transactions."
  },
  {
    id: 4,
    icon: "Globe",
    title: "Global Access",
    description: "Bank from anywhere in the world with multi-currency support and international transfer capabilities."
  },
  {
    id: 5,
    icon: "TrendingUp",
    title: "Smart Savings",
    description: "Automated savings tools, competitive interest rates, and personalized investment recommendations to grow your wealth."
  },
  {
    id: 6,
    icon: "Users",
    title: "Family Banking",
    description: "Manage multiple accounts, set up allowances for kids, and share expenses with family members seamlessly."
  }];


  const trustIndicators: TrustIndicator[] = [
  { id: 1, icon: "Shield", label: "SSL Certified" },
  { id: 2, icon: "CheckCircle", label: "PCI Compliant" },
  { id: 3, icon: "Lock", label: "SOC 2 Type II" },
  { id: 4, icon: "Award", label: "ISO 27001" }];


  const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Small Business Owner",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_10df5a971-1765003957966.png",
    alt: "Professional woman with brown hair in business casual attire smiling at camera against neutral background",
    rating: 5,
    comment: "TrustPay has transformed how I manage my business finances. The instant transfers and detailed analytics help me make better financial decisions every day."
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Freelance Designer",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11e9982cf-1763295713796.png",
    alt: "Young Asian man with glasses wearing casual shirt smiling confidently in modern office setting",
    rating: 5,
    comment: "The web app is incredibly intuitive and the security features give me peace of mind. I can manage all my accounts on the go without any hassle."
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Marketing Manager",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11504e941-1763295994346.png",
    alt: "Hispanic woman with long dark hair in professional blazer smiling warmly in bright office environment",
    rating: 5,
    comment: "Best banking experience I've ever had. The customer support is outstanding and the platform is so easy to use. Highly recommend to everyone!"
  }];


  return (
    <>
      <Helmet>
        <title>TrustPay - Modern Digital Banking Made Simple</title>
        <meta
          name="description"
          content="Experience secure, convenient digital banking with TrustPay. Instant transfers, 24/7 access, and bank-level security. Join 50,000+ satisfied users today." />

        <meta name="keywords" content="mobile banking, digital banking, online banking, secure banking, instant transfers" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection content={heroContent} />

        <TrustIndicators indicators={trustIndicators} />

        <section className="py-16 lg:py-24">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Everything You Need to Bank Smarter
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Powerful features designed to make your banking experience seamless, secure, and efficient
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) =>
                <FeatureCard key={feature.id} feature={feature} />
                )}
              </div>
            </div>
          </div>
        </section>

        <BenefitSection benefits={benefits} />

        <section className="py-16 lg:py-24 bg-background">
          <div className="px-nav-margin">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Trusted by Thousands of Happy Customers
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  See what our users have to say about their banking experience with TrustPay
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial) =>
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                )}
              </div>
            </div>
          </div>
        </section>

        <CTASection />

        <Footer />
      </div>
    </>);

};

export default LandingPage;
