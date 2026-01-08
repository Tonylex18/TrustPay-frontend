import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { API_BASE_URL, getStoredToken } from '../../utils/api';
import AccountSelector, { Account } from '../../components/ui/AccountSelector';
import Icon from '../../components/AppIcon';
import { apiFetch } from 'utils/apiFetch';

type DepositReceipt = {
  id?: string;
  status?: string;
  amountCents?: number;
  currency?: string;
  account?: Account | null;
  amount?: number;
};

const formatCurrency = (value: number, currency: string = 'USD', locale: string = 'en-US') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(value);

const maskedAccountNumber = (account: Account | null) => {
  const acctNum = account?.account_number || account?.accountNumber || '';
  if (!acctNum) return '—';
  return `•••• ${acctNum.slice(-4)}`;
};

interface DepositPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  currency?: string;
  account: Account | null;
  isProcessing: boolean;
  errorMessage?: string | null;
}

const DepositPreviewModal: React.FC<DepositPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currency = 'USD',
  account,
  isProcessing,
  errorMessage
}) => {
  const { t, i18n } = useTranslation('deposit');
  if (!isOpen) return null;

  const amountDisplay = formatCurrency(amount, currency, i18n.language);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4 animate-fade-in"
      onClick={() => {
        if (!isProcessing) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-preview-title"
    >
      <div
        className="bg-card rounded-xl shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 id="deposit-preview-title" className="text-lg font-semibold text-foreground">
            {t('previewModal.title')}
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            aria-label="Close confirmation modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Send" size={28} color="var(--color-primary)" />
            </div>
            <p className="text-3xl font-bold text-foreground">{amountDisplay}</p>
            <p className="text-sm text-muted-foreground">{t('previewModal.depositAmount')}</p>
          </div>

          <div className="bg-muted/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="Banknote" size={22} color="var(--color-primary)" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {account?.type || t('previewModal.selectedAccount')}
                </p>
                <p className="text-xs text-muted-foreground truncate">{maskedAccountNumber(account)}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('previewModal.accountNumber')}</span>
              <span className="font-medium text-foreground">{maskedAccountNumber(account)}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{t('previewModal.processingFee')}</span>
              <span className="font-medium text-foreground">{formatCurrency(0, currency, i18n.language)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-border">
              <span className="font-semibold text-foreground">{t('previewModal.totalDeposit')}</span>
              <span className="font-bold text-primary">{amountDisplay}</span>
            </div>
          </div>

          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5 flex-shrink-0" />
              <p className="text-xs text-warning-foreground">
                {t('previewModal.warning')}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} fullWidth>
            {t('previewModal.cancel')}
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            loading={isProcessing}
            iconName="Check"
            iconPosition="left"
            fullWidth
          >
            {isProcessing ? t('previewModal.submitting') : t('previewModal.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface DepositSubmittedModalProps {
  isOpen: boolean;
  deposit: DepositReceipt | null;
  onClose: () => void;
  onMakeAnother: () => void;
}

const DepositSubmittedModal: React.FC<DepositSubmittedModalProps> = ({
  isOpen,
  deposit,
  onClose,
  onMakeAnother
}) => {
  const { t, i18n } = useTranslation('deposit');
  if (!isOpen || !deposit) return null;

  const currency = deposit.currency || deposit.account?.currency || 'USD';
  const amountValue =
    typeof deposit.amountCents === 'number' ? deposit.amountCents / 100 : deposit.amount || 0;
  const amountDisplay = formatCurrency(amountValue, currency, i18n.language);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-submitted-title"
    >
      <div
        className="bg-card rounded-xl shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 id="deposit-submitted-title" className="text-lg font-semibold text-foreground">
            {t('submittedModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close submitted modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-success/10 flex items-center justify-center">
              <Icon name="BadgeCheck" size={28} color="var(--color-success)" />
            </div>
            <p className="text-3xl font-bold text-foreground">{amountDisplay}</p>
            <p className="text-sm text-muted-foreground">{t('submittedModal.depositAmount')}</p>
          </div>

          <div className="bg-muted/40 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('submittedModal.status')}</span>
              <span className="font-semibold text-foreground">{deposit.status || 'PENDING'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('submittedModal.account')}</span>
              <span className="font-medium text-foreground">
                {deposit.account?.type || t('previewModal.selectedAccount')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('submittedModal.accountNumber')}</span>
              <span className="font-medium text-foreground">{maskedAccountNumber(deposit.account || null)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('submittedModal.reference')}</span>
              <span className="font-medium text-foreground">
                {deposit.id || t('submittedModal.pendingReference')}
              </span>
            </div>
          </div>

          <div className="p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground">
            {t('submittedModal.note')}
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
          <Button variant="outline" onClick={onClose} fullWidth>
            {t('submittedModal.close')}
          </Button>
          <Button variant="default" onClick={onMakeAnother} iconName="RefreshCcw" iconPosition="left" fullWidth>
            {t('submittedModal.makeAnother')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DepositForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('deposit');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmittedOpen, setIsSubmittedOpen] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositReceipt | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setConfirmationError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage(t('messages.error.amount'));
      return;
    }
    if (!accountId) {
      setErrorMessage(t('messages.error.account'));
      return;
    }
    if (!frontImage || !backImage) {
      setErrorMessage(t('messages.error.images'));
      return;
    }

    setIsPreviewOpen(true);
  };

  const handleConfirmDeposit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0 || !accountId || !frontImage || !backImage) {
      setIsPreviewOpen(false);
      setErrorMessage(t('messages.error.completeForm'));
      return;
    }

    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setConfirmationError(null);

    try {
      const fd = new FormData();
      fd.append('amount', numericAmount.toString());
      fd.append('bankAccountId', accountId);
      fd.append('frontImage', frontImage);
      fd.append('backImage', backImage);

      const response = await apiFetch(`${API_BASE_URL}/mobile-deposits`, {
        method: 'POST',
        body: fd
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || t('messages.error.submitFailed');
        setConfirmationError(message);
        toast.error(message);
        return;
      }

      const depositReceipt: DepositReceipt = {
        id: payload?.id,
        status: payload?.status,
        amountCents: payload?.amountCents,
        currency: payload?.currency || account?.currency || 'USD',
        account,
        amount: numericAmount
      };

      setSubmittedDeposit(depositReceipt);
      setIsPreviewOpen(false);
      setIsSubmittedOpen(true);
      toast.success(t('messages.success'));
    } catch (error) {
      const message = t('messages.error.processFailed');
      setConfirmationError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!frontImage) {
      setFrontPreview(null);
      return;
    }
    const url = URL.createObjectURL(frontImage);
    setFrontPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [frontImage]);

  useEffect(() => {
    if (!backImage) {
      setBackPreview(null);
      return;
    }
    const url = URL.createObjectURL(backImage);
    setBackPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [backImage]);

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 shadow-card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          <div className="w-full">
            <Input
              label={t('form.amountLabel')}
              type="number"
              placeholder={t('form.amountPlaceholder')}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              description={t('form.amountDescription')}
              required
              className="w-full"
            />
          </div>
          <div className="w-full">
            <AccountSelector
              onSelect={(id, acct) => {
                setAccountId(id);
                setAccount(acct || null);
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground space-y-3">
          <div className="font-medium">{t('form.accountNameLabel')}: {account?.type || '—'}</div>
          <div>{t('form.accountNumberLabel')}: {account?.account_number || account?.accountNumber || '—'}</div>
          <div>{t('form.bankNameLabel')}: {t('form.bankNameValue')}</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t('form.checkImagesLabel')}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background/60 px-4 py-6 cursor-pointer hover:border-foreground/50 transition min-h-[200px]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFrontImage(e.target.files?.[0] || null)}
                required
              />
              <div className="text-sm font-medium text-foreground mb-1">{t('form.frontLabel')}</div>
              {frontPreview ? (
                <div className="w-full rounded-md border border-border/60 bg-white overflow-hidden">
                  <img src={frontPreview} alt="Front of check preview" className="w-full h-40 object-contain" />
                </div>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground mb-2">{t('form.tapToUpload')}</div>
                  <div className="text-2xl text-muted-foreground">↑</div>
                </>
              )}
            </label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background/60 px-4 py-6 cursor-pointer hover:border-foreground/50 transition min-h-[200px]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setBackImage(e.target.files?.[0] || null)}
                required
              />
              <div className="text-sm font-medium text-foreground mb-1">{t('form.backLabel')}</div>
              {backPreview ? (
                <div className="w-full rounded-md border border-border/60 bg-white overflow-hidden">
                  <img src={backPreview} alt="Back of check preview" className="w-full h-40 object-contain" />
                </div>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground mb-2">{t('form.tapToUpload')}</div>
                  <div className="text-2xl text-muted-foreground">↑</div>
                </>
              )}
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('form.uploadNote')}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {errorMessage}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={isProcessing}>
          {t('form.submit')}
        </Button>
      </form>

      <DepositPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsPreviewOpen(false);
            setConfirmationError(null);
          }
        }}
        onConfirm={handleConfirmDeposit}
        amount={Number(amount) || 0}
        currency={account?.currency || 'USD'}
        account={account}
        isProcessing={isProcessing}
        errorMessage={confirmationError}
      />

      <DepositSubmittedModal
        isOpen={isSubmittedOpen}
        deposit={submittedDeposit}
        onClose={() => setIsSubmittedOpen(false)}
        onMakeAnother={() => {
          setIsSubmittedOpen(false);
          setSubmittedDeposit(null);
          setAmount('');
          setFrontImage(null);
          setBackImage(null);
          setFrontPreview(null);
          setBackPreview(null);
          setErrorMessage(null);
          setConfirmationError(null);
        }}
      />
    </>
  );
};

const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('deposit');

  const breadcrumbItems = [
    { label: t('breadcrumb.dashboard'), path: '/dashboard' },
    { label: t('breadcrumb.deposit') }
  ];

  useEffect(() => {
    if (!getStoredToken()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <BreadcrumbTrail items={breadcrumbItems} />
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{t('page.title')}</h1>
                <p className="text-muted-foreground">{t('page.subtitle')}</p>
              </div>

              <DepositForm />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DepositPage;
