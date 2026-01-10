import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import NavigationBar from "../../components/ui/NavigationBar";
import { API_BASE_URL, clearStoredToken, getStoredToken } from "../../utils/api";

type MobileDeposit = {
  id: string;
  userEmail?: string | null;
  accountNumber?: string | null;
  amountCents: number;
  currency?: string;
  status: string;
  frontImageUrl: string;
  backImageUrl: string;
  createdAt: string;
  rejectionReason?: string | null;
};

const AdminMobileDepositsPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [deposits, setDeposits] = useState<MobileDeposit[]>([]);
  const [selected, setSelected] = useState<MobileDeposit | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
    []
  );

  const fetchDeposits = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/mobile-deposits?status=PENDING`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = payload?.errors || payload?.message || "Unable to load mobile deposits.";
        toast.error(msg);
        if (response.status === 401 || response.status === 403) {
          clearStoredToken();
          setToken(null);
        }
        return;
      }
      setDeposits(Array.isArray(payload) ? payload : []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Unable to load mobile deposits.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchDeposits(token);
  }, [token]);

  const handleApprove = async (deposit: MobileDeposit) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mobile-deposits/${deposit.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.errors || payload?.message || "Unable to approve deposit.";
        toast.error(msg);
        return;
      }
      toast.success("Deposit approved.");
      setSelected(null);
      fetchDeposits(token);
    } catch (_err) {
      toast.error("Unable to approve deposit.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (deposit: MobileDeposit) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mobile-deposits/${deposit.id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.errors || payload?.message || "Unable to reject deposit.";
        toast.error(msg);
        return;
      }
      toast.success("Deposit rejected.");
      setSelected(null);
      setRejectReason("");
      fetchDeposits(token);
    } catch (_err) {
      toast.error("Unable to reject deposit.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatAmount = (cents: number, currency?: string) => {
    const curr = (currency || "USD").toUpperCase();
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(
        cents / 100
      );
    } catch {
      return `${(cents / 100).toFixed(2)} ${curr}`;
    }
  };

  const formatDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  return (
    <>
      <Helmet>
        <title>Admin - Mobile Deposits | TrustPay</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <NavigationBar onNavigate={(path) => navigate(path)} />
        <main className="pt-nav-height px-nav-margin py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mobile Deposits</h1>
              <p className="text-sm text-muted-foreground">Review and approve uploaded checks.</p>
            </div>
            <Button variant="outline" onClick={() => fetchDeposits(token || "")} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
              <div>User Email</div>
              <div>Account</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Submitted</div>
              <div className="text-right">Action</div>
            </div>
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : deposits.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No pending mobile deposits.
              </div>
            ) : (
              deposits.map((d) => (
                <div
                  key={d.id}
                  className="grid grid-cols-6 gap-4 px-4 py-3 text-sm border-b border-border last:border-b-0 items-center"
                >
                  <div className="truncate">{d.userEmail || "—"}</div>
                  <div>{d.accountNumber || "—"}</div>
                  <div>{formatAmount(d.amountCents, d.currency)}</div>
                  <div className="font-medium">{d.status}</div>
                  <div>{formatDate(d.createdAt)}</div>
                  <div className="text-right">
                    <Button size="sm" onClick={() => setSelected(d)}>
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Deposit Details</h2>
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDate(selected.createdAt)}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selected.userEmail || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Account</p>
                  <p className="font-medium">{selected.accountNumber || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {currencyFormatter.format(selected.amountCents / 100)}{" "}
                    {(selected.currency || "USD").toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{selected.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">Front of check</p>
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                    <img src={selected.frontImageUrl} alt="Check front" className="w-full" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">Back of check</p>
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                    <img src={selected.backImageUrl} alt="Check back" className="w-full" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rejection reason (optional)</label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
              <Button
                variant="destructive"
                onClick={() => handleReject(selected)}
                loading={actionLoading}
              >
                Reject
              </Button>
              <Button onClick={() => handleApprove(selected)} loading={actionLoading} variant="default">
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMobileDepositsPage;
