import { ProfileSectionProps } from "../types";


const ProfileSection = ({ title, description, children, className = '' }: ProfileSectionProps) => {
  return (
    <div className={`bg-card rounded-lg border border-border p-6 shadow-card ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export default ProfileSection;