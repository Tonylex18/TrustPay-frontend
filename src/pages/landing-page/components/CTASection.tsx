import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 py-16 lg:py-24">
      <div className="px-nav-margin">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Icon name="Sparkles" size={16} color="white" />
            <span className="text-sm font-medium text-white">
              Get Started Today
            </span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Banking Experience?
          </h2>

          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust TrustPay for their financial needs. Open your account in minutes and start banking smarter.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/registration')}
              iconName="UserPlus"
              iconPosition="right"
              className="min-w-[200px]"
            >
              Create Free Account
            </Button>
            {/* <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              iconName="ArrowRight"
              iconPosition="right"
              className="min-w-[200px] bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              View Demo
            </Button> */}
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/80">Active Users</p>
            </div>
            <div className="w-px h-12 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">$2B+</p>
              <p className="text-sm text-white/80">Transactions</p>
            </div>
            <div className="w-px h-12 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4.9/5</p>
              <p className="text-sm text-white/80">User Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;