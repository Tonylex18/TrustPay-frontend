import { useTranslation } from "react-i18next";
import { PasswordStrength } from "../types";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
}

const PasswordStrengthIndicator = ({ strength }: PasswordStrengthIndicatorProps) => {
  const { t } = useTranslation('registration');
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('password.strengthTitle')}</span>
        <span className={`text-sm font-medium ${strength.color}`}>
          {strength.label}
        </span>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color.replace('text-', 'bg-')}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label="Password strength indicator"
        />
      </div>

      <div className="space-y-1 mt-3">
        {strength.requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              req.met ? 'bg-success' : 'bg-muted'
            }`}>
              {req.met && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${req.met ? 'text-success' : 'text-muted-foreground'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
