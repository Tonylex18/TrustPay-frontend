import React from 'react';
import Icon from '../../../components/AppIcon';

type FooterLink = { label: string; href: string };

type FooterContent = {
  description: string;
  productTitle: string;
  companyTitle: string;
  legalTitle: string;
  productLinks: FooterLink[];
  companyLinks: FooterLink[];
  legalLinks: FooterLink[];
  bottom: {
    rights: string;
    encryption: string;
    insured: string;
  };
};

const Footer = ({ content }: { content: FooterContent }) => {
  const currentYear = new Date()?.getFullYear();

  const socialLinks = [
    { icon: "Facebook", label: "Facebook", href: "#" },
    { icon: "Twitter", label: "Twitter", href: "#" },
    { icon: "Linkedin", label: "LinkedIn", href: "#" },
    { icon: "Instagram", label: "Instagram", href: "#" }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="px-nav-margin py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Landmark" size={24} color="white" />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  TrustPay
                </span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {content.description}
              </p>
              <div className="flex items-center gap-4">
                {socialLinks?.map((social) => (
                  <a
                    key={social?.label}
                    href={social?.href}
                    className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-white flex items-center justify-center transition-colors duration-300"
                    aria-label={social?.label}
                  >
                    <Icon name={social?.icon} size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">{content.productTitle}</h3>
              <ul className="space-y-3">
                {content?.productLinks?.map((link) => (
                  <li key={link?.label}>
                    <a
                      href={link?.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link?.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">{content.companyTitle}</h3>
              <ul className="space-y-3">
                {content?.companyLinks?.map((link) => (
                  <li key={link?.label}>
                    <a
                      href={link?.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link?.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">{content.legalTitle}</h3>
              <ul className="space-y-3">
                {content?.legalLinks?.map((link) => (
                  <li key={link?.label}>
                    <a
                      href={link?.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link?.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {content.bottom.rights.replace('{{year}}', String(currentYear))}
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Icon name="Shield" size={16} color="var(--color-success)" />
                  <span className="text-sm text-muted-foreground">
                    {content.bottom.encryption}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Lock" size={16} color="var(--color-success)" />
                  <span className="text-sm text-muted-foreground">
                    {content.bottom.insured}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
