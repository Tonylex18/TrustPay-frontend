import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import NavigationBar from '../../components/ui/NavigationBar';
import BreadcrumbTrail from '../../components/ui/BreadcrumbTrail';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { API_BASE_URL, getStoredToken } from '../../utils/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const BillPaymentForm = () => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [billerName, setBillerName] = useState('');
  const [billType, setBillType] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      const message = 'Enter a valid bill amount.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!billerName.trim()) {
      const message = 'Enter a biller name.';
      setErrorMessage(message);
      toast.error(message);
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
      const intentResponse = await fetch(`${API_BASE_URL}/api/payments/bill-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numericAmount,
          currency: 'usd',
          billerName,
          billType,
          note
        })
      });

      const intentPayload = await intentResponse.json().catch(() => null);
      if (!intentResponse.ok) {
        const message = intentPayload?.errors || intentPayload?.message || 'Unable to start bill payment.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const clientSecret = intentPayload?.data?.clientSecret as string | undefined;
      const paymentIntentId = intentPayload?.data?.paymentIntentId as string | undefined;
      if (!clientSecret || !paymentIntentId) {
        const message = 'Unable to initialize payment.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        const message = 'Card element not ready.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const confirmation = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement
        }
      });

      if (confirmation.error) {
        const message = confirmation.error.message || 'Payment failed.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (confirmation.paymentIntent?.status !== 'succeeded') {
        const message = 'Payment did not complete. Please try again.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      await fetch(`${API_BASE_URL}/api/payments/confirm-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentIntentId
        })
      });

      toast.success('Bill payment completed.');
      navigate('/dashboard');
    } catch (error) {
      const message = 'Unable to process bill payment right now.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 shadow-card space-y-5">
      <Input
        label="Biller Name"
        type="text"
        placeholder="Utility or service provider"
        value={billerName}
        onChange={(event) => setBillerName(event.target.value)}
        required
      />

      <Input
        label="Bill Type"
        type="text"
        placeholder="Electricity, Internet, Subscription"
        value={billType}
        onChange={(event) => setBillType(event.target.value)}
      />

      <Input
        label="Bill Amount"
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        required
      />

      <Input
        label="Memo (Optional)"
        type="text"
        placeholder="Add a note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Card Details</label>
        <div className="rounded-md border border-input bg-background px-3 py-3">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isProcessing}>
        Pay Bill
      </Button>
    </form>
  );
};

const BillsPage: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Pay Bills' }
  ];

  useEffect(() => {
    if (!getStoredToken()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Pay Bills - TrustPay</title>
        <meta name="description" content="Pay your bills securely with Stripe-powered payment rails." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height">
          <div className="px-nav-margin py-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <BreadcrumbTrail items={breadcrumbItems} />
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Pay Bills</h1>
                <p className="text-muted-foreground">
                  Schedule and complete bill payments securely with your TrustPay balance and Stripe payment rails.
                </p>
              </div>

              <Elements stripe={stripePromise}>
                <BillPaymentForm />
              </Elements>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BillsPage;
