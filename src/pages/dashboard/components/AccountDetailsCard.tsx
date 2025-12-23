import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Account } from "../types";

type Props = {
  account: Account | null;
  accountName?: string;
  bankName?: string;
};

const AccountDetailsCard: React.FC<Props> = ({ account, accountName, bankName = "TrustPay Sandbox Bank" }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!account) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-card text-sm text-muted-foreground">
        Select or create an account to view details.
      </div>
    );
  }

  const rows: Array<{ label: string; value: string; copyKey: string }> = [
    { label: "Account Name", value: accountName || "—", copyKey: "accountName" },
    { label: "Bank Name", value: bankName, copyKey: "bankName" },
    { label: "Account Type", value: account.type, copyKey: "accountType" },
    { label: "Account Number", value: account.accountNumber, copyKey: "accountNumber" },
    { label: "Routing Number", value: account.routingNumber || "—", copyKey: "routingNumber" },
    { label: "Currency", value: account.currency || "USD", copyKey: "currency" },
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
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Account Details</p>
          <h3 className="text-lg font-semibold text-foreground">{accountName || "Your Account"}</h3>
        </div>
        <Icon name="ShieldCheck" size={20} color="var(--color-primary)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
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
