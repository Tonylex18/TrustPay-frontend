import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/ui/NavigationBar";
import Button from "../../components/ui/Button";
import { Account } from "../../components/ui/AccountSelector";

type LocationState = {
  deposit?: {
    id?: string;
    status?: string;
    amountCents?: number;
    currency?: string;
    account?: Account | null;
    amount?: number;
  };
};

const DepositConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const deposit = (location.state as LocationState | null)?.deposit;

  const amountDisplay = useMemo(() => {
    const currency = (deposit?.currency || "USD").toUpperCase();
    const cents = deposit?.amountCents;
    if (typeof cents === "number") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
    }
    if (typeof deposit?.amount === "number") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(deposit.amount);
    }
    return "—";
  }, [deposit]);

  const accountLabel = useMemo(() => {
    const acct = deposit?.account;
    if (!acct) return "—";
    const acctNum = acct.account_number || acct.accountNumber || "";
    const last4 = acctNum ? acctNum.slice(-4) : "";
    return `${acct.type || "Account"} ••••${last4} (${(acct.currency || "USD").toUpperCase()})`;
  }, [deposit]);

  if (!deposit) {
    return <Navigate to="/deposit" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Deposit Submitted | TrustPay</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height">
          <div className="px-nav-margin py-10">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Deposit Submitted</h1>
                <p className="text-muted-foreground">
                  We received your mobile check deposit. It will remain pending until an admin reviews it.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg shadow-card p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold text-foreground">{amountDisplay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-foreground">
                      {deposit.status ? deposit.status : "PENDING"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <p className="text-lg font-semibold text-foreground">{accountLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="text-lg font-semibold text-foreground">
                      {deposit.id || "Pending assignment"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  You will be notified once this deposit is reviewed. Funds are unavailable until approval.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="default" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/deposit")}>
                  Make another deposit
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DepositConfirmationPage;
