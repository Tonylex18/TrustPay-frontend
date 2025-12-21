import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { API_BASE_URL, getStoredToken } from '../../utils/api';
import AccountSelector from '../../components/ui/AccountSelector';

const DepositForm = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Enter a valid deposit amount.');
      return;
    }
    if (!accountId) {
      setErrorMessage('Select an account to fund.');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numericAmount,
          description: note,
          account_id: accountId
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.errors || payload?.message || 'Unable to start deposit.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      toast.success('Deposit initiated. It will complete shortly.');
      navigate('/dashboard');
    } catch (error) {
      const message = 'Unable to process deposit right now.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 shadow-card space-y-5">
      <Input
        label="Deposit Amount"
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        description="Minimum deposit $1"
        required
      />

      <Input
        label="Description (Optional)"
        type="text"
        placeholder="Add a note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      <AccountSelector onSelect={(id) => setAccountId(id)} />

      {errorMessage && (
        <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isProcessing}>
        Deposit Funds
      </Button>
    </form>
  );
};

const DepositPage: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Deposit Money' }
  ];

  useEffect(() => {
    if (!getStoredToken()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Deposit Money - TrustPay</title>
        <meta name="description" content="Add funds to your TrustPay account using secure Stripe payment rails." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <BreadcrumbTrail items={breadcrumbItems} />
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Deposit Money</h1>
                <p className="text-muted-foreground">
                  Fund your TrustPay balance with a card or ACH-enabled payment method.
                </p>
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
