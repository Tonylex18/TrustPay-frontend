import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL, getStoredToken } from "../../utils/api";
import { apiFetch } from "utils/apiFetch";

export type Account = {
  id: string;
  account_number?: string;
  accountNumber?: string;
  type?: string;
  balance?: number;
  available_balance?: number;
  posted_balance?: number;
  currency?: string;
};

interface AccountSelectorProps {
  onSelect: (id: string, account?: Account) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ onSelect }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`${API_BASE_URL}/accounts`, {});
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = payload?.errors || payload?.message || "Unable to load accounts.";
          setError(msg);
          return;
        }
        const data: Account[] = Array.isArray(payload) ? payload : [];
        setAccounts(data);
        if (data[0]?.id) {
          setSelected(data[0].id);
          onSelectRef.current(data[0].id, data[0]);
        }
      } catch (_err) {
        setError("Unable to load accounts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading accounts...</div>;
  }

  if (error) {
    return <div className="text-sm text-error">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Select Account</label>
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={selected}
        onChange={(e) => {
          const next = e.target.value;
          setSelected(next);
          const acct = accounts.find((a) => a.id === next);
          onSelect(next, acct);
        }}
      >
        {accounts.map((acct) => {
          const acctNum = acct.account_number || acct.accountNumber || "";
          const last4 = acctNum ? acctNum.slice(-4) : "";
          const label = `${acct.type || "account"} ••••${last4} (${acct.currency || "USD"})`;
          return (
            <option key={acct.id} value={acct.id}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default AccountSelector;
