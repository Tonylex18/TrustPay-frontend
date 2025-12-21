import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';
import { HeroContent } from '../types';

interface HeroSectionProps {
    content: HeroContent;
}

const HeroSection = ({ content }: HeroSectionProps) => {
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    return (
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />

            <div className="relative px-nav-margin py-16 lg:py-24">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                                <span className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden="true" />
                                <span className="text-sm font-medium text-primary">
                                    {content.headline}
                                </span>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                                {content.subheadline}
                            </h1>

                            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
                                {content.description}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                {content.buttons.map((button, index) =>
                                    <Button
                                        key={index}
                                        variant={button.variant}
                                        size="lg"
                                        onClick={() => handleNavigation(button.path)}
                                        iconName={button.icon as any}
                                        iconPosition="right"
                                        className="min-w-[160px]">

                                        {button.label}
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) =>
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center"
                                            aria-hidden="true">

                                            <span className="text-xs font-semibold text-primary">
                                                {i}K+
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        50,000+ Active Users
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Join our growing community
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative lg:h-[600px] hidden lg:block">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl transform rotate-3" aria-hidden="true" />
                            <div className="relative h-full bg-card rounded-3xl shadow-2xl overflow-hidden border border-border">
                                <Image
                                    src="https://img.rocket.new/generatedImages/rocket_gen_img_1b129949e-1763293854564.png"
                                    alt="Professional woman in business attire using mobile banking app on smartphone in modern office with natural lighting"
                                    className="w-full h-full object-cover" />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
                                <div className="absolute bottom-8 left-8 right-8 text-white">
                                    <p className="text-2xl font-bold mb-2">
                                        Banking Made Simple
                                    </p>
                                    <p className="text-sm opacity-90">
                                        Manage your finances anytime, anywhere
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);

};

export default HeroSection;