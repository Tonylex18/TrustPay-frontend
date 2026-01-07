import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n/config';
import { cn } from '../utils/cn';

type Props = {
  className?: string;
  variant?: 'primary' | 'neutral';
};

const LanguageSelector: React.FC<Props> = ({ className, variant = 'neutral' }) => {
  const { i18n, t } = useTranslation('common');

  const currentLanguage = useMemo(() => {
    const resolved = i18n.resolvedLanguage || i18n.language;
    const match = supportedLanguages.find((lang) => resolved?.startsWith(lang.code));
    return match?.code || supportedLanguages[0].code;
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next && next !== i18n.language) {
      i18n.changeLanguage(next);
    }
  };

  const selectClasses =
    variant === 'primary'
      ? 'bg-white/10 text-white border border-white/35 hover:bg-white/15 focus-visible:ring-white/70'
      : 'bg-white text-foreground border border-border hover:bg-muted focus-visible:ring-primary/50';

  const caretClasses = variant === 'primary' ? 'text-white/80' : 'text-muted-foreground';

  const languageNameKey: Record<string, string> = {
    en: 'english',
    fr: 'french',
    es: 'spanish',
    de: 'german',
    el: 'greek',
    pt: 'portuguese'
  };

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('aria.languageSelector')}
        value={currentLanguage}
        onChange={handleChange}
        className={cn(
          'appearance-none h-10 min-w-[92px] rounded-full px-3 pr-8 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
          selectClasses
        )}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.shortLabel} · {t(`language.${languageNameKey[lang.code] ?? lang.code}`)}
          </option>
        ))}
      </select>
      <span className={cn('pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs', caretClasses)}>
        ▾
      </span>
    </div>
  );
};

export default LanguageSelector;
