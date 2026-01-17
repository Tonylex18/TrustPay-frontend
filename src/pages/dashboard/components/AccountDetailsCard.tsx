import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Account } from "../types";
import { useCurrency } from "../../../context/CurrencyContext";

type Props = {
  account: Account | null;
  accountName?: string;
  bankName?: string;
};

const AccountDetailsCard: React.FC<Props> = ({ account, accountName, bankName = "TrustPay Bank" }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { currency } = useCurrency();

  if (!account) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-card text-sm text-muted-foreground">
        Select or create an account to view details.
      </div>
    );
  }

  const deriveExpiry = () => {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const year = `${(now.getFullYear() + 3) % 100}`.padStart(2, "0");
    return `${month}/${year}`;
  };

  const cardNumberRaw = account.accountNumber || "";
  const digitsOnly = cardNumberRaw.replace(/\D/g, "");

  const formatCardNumber = (value: string, masked: boolean) => {
    if (!value) {
      return masked ? "**** **** **** ****" : "0000 0000 0000 0000";
    }
    const maskStart = Math.max(0, value.length - 4);
    const maskedValue = masked
      ? `${"*".repeat(maskStart)}${value.slice(-4)}`
      : value;
    return maskedValue.match(/.{1,4}/g)?.join(" ") || maskedValue;
  };

  const maskedCardNumber = formatCardNumber(digitsOnly, true);
  const fullCardNumber = formatCardNumber(digitsOnly, false);
  const cardholderName = accountName || "Cardholder";
  const expiry = deriveExpiry();
  const cvv = (account.routingNumber || "").toString().slice(-3).padStart(3, "0");

  const quickRows: Array<{ label: string; value: string; copyKey: string }> = [
    { label: "Card Number", value: fullCardNumber, copyKey: "cardNumber" },
    { label: "CVV", value: cvv, copyKey: "cvv" },
    { label: "Routing", value: account.routingNumber || "—", copyKey: "routingNumber" },
    { label: "Account", value: account.accountNumber || "—", copyKey: "accountNumber" },
  ];

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (_err) {
      setCopied(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Virtual Card</p>
          <h3 className="text-lg font-semibold text-foreground">{accountName || "Your Account"}</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          iconName={showDetails ? "EyeOff" : "Eye"}
          onClick={() => setShowDetails((prev) => !prev)}
        >
          {showDetails ? "Hide card details" : "View card details"}
        </Button>
      </div>

      <div className="relative w-full h-56 mb-4" style={{ perspective: "1200px" }}>
        <div
          className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
            showDetails ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white p-5 shadow-2xl [backface-visibility:hidden]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/70">TrustPay</p>
                <p className="text-sm font-semibold">{bankName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Wifi" size={20} color="rgba(255,255,255,0.8)" />
                <div className="w-10 h-7 rounded-md bg-white/70" />
              </div>
            </div>

            <div className="mt-8 text-xl font-semibold tracking-[0.28em]">{maskedCardNumber}</div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/70">Card Holder</p>
                <p className="text-base font-semibold">{cardholderName}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-white/70">Expires</p>
                <p className="text-base font-semibold">{expiry}</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-5 text-sm font-semibold text-white/80">
              {account.type === "credit" ? "Virtual Credit" : "Virtual Debit"}
            </div>
          </div>

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-5 shadow-2xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="absolute inset-x-0 top-6 h-10 bg-white/20" />
            <div className="mt-12 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Card Number</p>
                <p className="text-lg font-semibold tracking-[0.2em]">{fullCardNumber}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Card Holder</p>
                  <p className="text-sm font-semibold">{cardholderName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-white/60">CVV</p>
                  <p className="text-sm font-semibold">{cvv}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Expiry</p>
                  <p className="text-sm font-semibold">{expiry}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Currency</p>
                  <p className="text-sm font-semibold">{currency}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
              <p className="text-sm font-semibold text-foreground truncate">{row.value || "—"}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              iconName={copied === row.copyKey ? "Check" : "Copy"}
              onClick={() => handleCopy(row.value, row.copyKey)}
            >
              {copied === row.copyKey ? "Copied" : "Copy"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountDetailsCard;
