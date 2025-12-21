import React, { useEffect, useState } from "react";
import Input from "./Input";
import { API_BASE_URL, getStoredToken, clearStoredToken } from "../../utils/api";
import { useNavigate } from "react-router-dom";

type Account = {
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
  onSelect: (id: string) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ onSelect }) => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      if (!token) {
        navigate("/login");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = payload?.errors || payload?.message || "Unable to load accounts.";
          setError(msg);
          if (res.status === 401) {
            clearStoredToken();
            navigate("/login");
          }
          return;
        }
        const data: Account[] = Array.isArray(payload) ? payload : [];
        setAccounts(data);
        if (data[0]?.id) {
          setSelected(data[0].id);
          onSelect(data[0].id);
        }
      } catch (_err) {
        setError("Unable to load accounts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, onSelect]);

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
          setSelected(e.target.value);
          onSelect(e.target.value);
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
