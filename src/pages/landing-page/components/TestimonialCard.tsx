import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import { Testimonial } from '../types';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, index) => (
          <Icon
            key={index}
            name="Star"
            size={16}
            color={index < testimonial.rating ? "var(--color-accent)" : "var(--color-muted)"}
            className={index < testimonial.rating ? "fill-accent" : ""}
          />
        ))}
      </div>

      <p className="text-muted-foreground leading-relaxed mb-6">
        "{testimonial.comment}"
      </p>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10">
          <Image
            src={testimonial.avatar}
            alt={testimonial.alt}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {testimonial.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;