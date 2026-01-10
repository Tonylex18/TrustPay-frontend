import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NavigationBar from "../../components/ui/NavigationBar";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Icon from "../../components/AppIcon";
import { API_BASE_URL, getStoredToken } from "../../utils/api";
import Input from "../../components/ui/Input";

type UserRow = {
	id: string;
	email: string;
	fullName?: string | null;
	role: string;
	kycStatus: string;
	disabled: boolean;
	createdAt: string;
	accountCount: number;
	totalBalance: number;
};

type Account = {
	id: string;
	userId: string;
	accountNumber: string;
	status: string;
	balance?: number;
};

type AdminCard = {
	id: string;
	userId: string;
	bankAccountId: string;
	brand: string;
	last4: string;
	status: string;
	createdAt: string;
};

const AdminUsersPage: React.FC = () => {
	const navigate = useNavigate();
	const token = getStoredToken();

	const [users, setUsers] = useState<UserRow[]>([]);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [cards, setCards] = useState<AdminCard[]>([]);
	const [cardsLoading, setCardsLoading] = useState(false);
	const [cardActionId, setCardActionId] = useState<string | null>(null);
	const [filterKyc, setFilterKyc] = useState<string>("ALL");
	const [filterDisabled, setFilterDisabled] = useState<string>("ALL");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

	useEffect(() => {
		if (!token) {
			navigate("/admin");
			return;
		}
		const controller = new AbortController();
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${API_BASE_URL}/admin/users`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				const payload = await res.json().catch(() => null);
				if (!res.ok) {
					const msg = payload?.errors || payload?.message || "Unable to load users.";
					toast.error(msg);
					if (res.status === 401 || res.status === 403) navigate("/admin");
					return;
				}
				const list = Array.isArray(payload) ? payload : payload?.users || [];
				setUsers(list);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					toast.error("Unable to load users.");
				}
			} finally {
				setLoading(false);
			}
		};

		const fetchAccounts = async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/admin/accounts`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				const payload = await res.json().catch(() => []);
				if (res.ok && Array.isArray(payload)) {
					setAccounts(
						payload.map((acct: any) => ({
							id: acct.id,
							userId: acct.userId,
							accountNumber: acct.accountNumber,
							status: acct.status,
						}))
					);
				}
			} catch {
				// ignore account fetch failures
			}
		};

		const fetchCards = async () => {
			setCardsLoading(true);
			try {
				const res = await fetch(`${API_BASE_URL}/admin/cards`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				const payload = await res.json().catch(() => []);
				if (res.ok && Array.isArray(payload)) {
					setCards(
						payload.map((card: any) => ({
							id: card.id,
							userId: card.userId,
							bankAccountId: card.bankAccountId,
							brand: card.brand,
							last4: card.last4,
							status: card.status,
							createdAt: card.createdAt,
						}))
					);
				}
			} catch {
				// ignore card fetch failures to avoid blocking user list
			} finally {
				setCardsLoading(false);
			}
		};

		fetchUsers();
		fetchAccounts();
		fetchCards();
		return () => controller.abort();
	}, [navigate, token]);

	const filteredUsers = useMemo(() => {
		return users.filter((u) => {
			if (filterKyc !== "ALL" && u.kycStatus !== filterKyc) return false;
			if (filterDisabled === "DISABLED" && !u.disabled) return false;
			if (filterDisabled === "ACTIVE" && u.disabled) return false;
			if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
			return true;
		});
	}, [users, filterKyc, filterDisabled, search]);

	const cardCountByUser = useMemo(() => {
		const counts: Record<string, number> = {};
		cards.forEach((c) => {
			counts[c.userId] = (counts[c.userId] || 0) + 1;
		});
		return counts;
	}, [cards]);

	const mutateUser = (userId: string, changes: Partial<UserRow>) => {
		setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
	};

	const performAction = async (userId: string, action: "disable" | "enable" | "delete") => {
		if (!token) return;
		try {
			let endpoint = `${API_BASE_URL}/admin/users/${userId}`;
			if (action === "disable") endpoint += "/disable";
			if (action === "enable") endpoint += "/enable";
			const res = await fetch(endpoint, {
				method: action === "delete" ? "DELETE" : "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => null);
				const msg = payload?.errors || payload?.message || "Unable to update user.";
				toast.error(msg);
				return;
			}
			if (action === "disable" || action === "delete") {
				mutateUser(userId, { disabled: true });
			} else if (action === "enable") {
				mutateUser(userId, { disabled: false });
			}
			toast.success(`User ${action}d.`);
		} catch {
			toast.error("Unable to update user.");
		}
	};

	const performCardAction = async (cardId: string, action: "freeze" | "unfreeze") => {
		if (!token) return;
		setCardActionId(`${cardId}:${action}`);
		try {
			const res = await fetch(
				`${API_BASE_URL}/admin/cards/${cardId}/${action}`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			const payload = await res.json().catch(() => null);
			if (!res.ok) {
				const msg = payload?.errors || payload?.message || "Unable to update card.";
				toast.error(msg);
				return;
			}
			setCards((prev) =>
				prev.map((c) =>
					c.id === cardId
						? { ...c, status: payload?.status || (action === "freeze" ? "FROZEN" : "ACTIVE") }
						: c
				)
			);
			toast.success(`Card ${action}d.`);
		} catch {
			toast.error("Unable to update card.");
		} finally {
			setCardActionId(null);
		}
	};

	const selectedAccounts = useMemo(
		() => (selectedUser ? accounts.filter((a) => a.userId === selectedUser.id) : []),
		[accounts, selectedUser]
	);

	const selectedCards = useMemo(
		() => (selectedUser ? cards.filter((c) => c.userId === selectedUser.id) : []),
		[cards, selectedUser]
	);

	const totalUsers = users.length;

	return (
		<div className="min-h-screen bg-background">
			<NavigationBar user={undefined} onNavigate={(path) => navigate(path)} />
			<main className="pt-nav-height px-nav-margin py-8 max-w-7xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Admin</p>
						<h1 className="text-3xl font-bold text-foreground">Users</h1>
						<p className="text-sm text-muted-foreground">Total users: {totalUsers}</p>
					</div>
					<Button variant="secondary" onClick={() => navigate("/admin")}>
						Back to Admin Home
					</Button>
				</div>

				<div className="bg-card border border-border rounded-2xl p-4 shadow-card grid gap-3 md:grid-cols-4">
					<Select
						label="KYC status"
						value={filterKyc}
						onChange={(v) => setFilterKyc(v as string)}
						options={[
							{ label: "All", value: "ALL" },
							{ label: "Pending", value: "PENDING" },
							{ label: "Approved", value: "APPROVED" },
							{ label: "Rejected", value: "REJECTED" },
						]}
					/>
					<Select
						label="User state"
						value={filterDisabled}
						onChange={(v) => setFilterDisabled(v as string)}
						options={[
							{ label: "All", value: "ALL" },
							{ label: "Active", value: "ACTIVE" },
							{ label: "Disabled", value: "DISABLED" },
						]}
					/>
					<Input
						label="Search email"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="user@example.com"
					/>
				</div>

				<div className="bg-card border border-border rounded-2xl p-4 shadow-card">
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading users...</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead className="text-left text-muted-foreground">
									<tr>
										<th className="py-2 pr-4">User</th>
										<th className="py-2 pr-4">Role</th>
										<th className="py-2 pr-4">KYC</th>
										<th className="py-2 pr-4">Accounts</th>
										<th className="py-2 pr-4">Cards</th>
										<th className="py-2 pr-4">Total Balance</th>
										<th className="py-2 pr-4">State</th>
										<th className="py-2 pr-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/60">
									{filteredUsers.map((u) => (
										<tr key={u.id} className={selectedUser?.id === u.id ? "bg-muted/50" : ""}>
											<td className="py-3 pr-4">
												<div className="font-semibold text-foreground">{u.fullName || "—"}</div>
												<div className="text-xs text-muted-foreground">{u.email}</div>
											</td>
											<td className="py-3 pr-4 uppercase">{u.role}</td>
											<td className="py-3 pr-4">
												<span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
													{u.kycStatus}
												</span>
											</td>
											<td className="py-3 pr-4">{u.accountCount}</td>
											<td className="py-3 pr-4">{cardCountByUser[u.id] || 0}</td>
											<td className="py-3 pr-4">${u.totalBalance.toFixed(2)}</td>
											<td className="py-3 pr-4">
												{u.disabled ? (
													<span className="text-xs font-semibold text-rose-600">Disabled</span>
												) : (
													<span className="text-xs font-semibold text-emerald-600">Active</span>
												)}
											</td>
											<td className="py-3 pr-4 text-right space-x-2">
												<Button size="sm" variant="secondary" onClick={() => setSelectedUser(u)}>
													View
												</Button>
												<Button
													size="sm"
													variant={u.disabled ? "secondary" : "ghost"}
													onClick={() => performAction(u.id, u.disabled ? "enable" : "disable")}
												>
													{u.disabled ? "Enable" : "Disable"}
												</Button>
												<Button size="sm" variant="ghost" onClick={() => performAction(u.id, "delete")}>
													Delete
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{filteredUsers.length === 0 && (
								<p className="text-sm text-muted-foreground mt-3">No users match this filter.</p>
							)}
						</div>
					)}
				</div>

				{selectedUser && (
					<div className="bg-card border border-border rounded-2xl p-5 shadow-card">
						<div className="flex items-center justify-between mb-3">
							<div>
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Selected User</p>
								<h3 className="text-xl font-semibold text-foreground">{selectedUser.fullName || selectedUser.email}</h3>
								<p className="text-sm text-muted-foreground">{selectedUser.email}</p>
							</div>
							<Button variant="ghost" onClick={() => setSelectedUser(null)}>
								Close
							</Button>
						</div>
						<div className="grid md:grid-cols-3 gap-4 text-sm">
							<div className="p-3 rounded-lg border border-border/60">
								<p className="text-muted-foreground text-xs uppercase">KYC</p>
								<p className="font-semibold">{selectedUser.kycStatus}</p>
							</div>
							<div className="p-3 rounded-lg border border-border/60">
								<p className="text-muted-foreground text-xs uppercase">Accounts</p>
								<p className="font-semibold">{selectedUser.accountCount}</p>
							</div>
							<div className="p-3 rounded-lg border border-border/60">
								<p className="text-muted-foreground text-xs uppercase">Total Balance</p>
								<p className="font-semibold">${selectedUser.totalBalance.toFixed(2)}</p>
							</div>
						</div>
						<div className="mt-4">
							<h4 className="text-sm font-semibold text-foreground mb-2">Accounts</h4>
							{selectedAccounts.length === 0 ? (
								<p className="text-sm text-muted-foreground">No accounts for this user.</p>
							) : (
								<div className="flex flex-wrap gap-3">
									{selectedAccounts.map((acct) => (
										<div key={acct.id} className="border border-border rounded-lg px-3 py-2 text-sm">
											<div className="font-semibold">••••{acct.accountNumber.slice(-4)}</div>
											<div className="text-xs text-muted-foreground uppercase">{acct.status}</div>
										</div>
									))}
								</div>
							)}
						</div>
						<div className="mt-4">
							<h4 className="text-sm font-semibold text-foreground mb-2">Cards</h4>
							{cardsLoading ? (
								<p className="text-sm text-muted-foreground">Loading cards...</p>
							) : selectedCards.length === 0 ? (
								<p className="text-sm text-muted-foreground">No cards for this user.</p>
							) : (
								<div className="grid sm:grid-cols-2 gap-3">
									{selectedCards.map((card) => {
										const account = accounts.find((a) => a.id === card.bankAccountId);
										return (
											<div key={card.id} className="border border-border rounded-lg px-3 py-2 text-sm space-y-1">
												<div className="flex items-center justify-between">
													<div>
														<div className="font-semibold">{card.brand || "Card"}</div>
														<div className="text-xs text-muted-foreground">••••{card.last4}</div>
													</div>
													<span className="text-[11px] font-semibold uppercase text-muted-foreground">{card.status}</span>
												</div>
												<div className="text-xs text-muted-foreground">
													Account: {account ? `••••${account.accountNumber.slice(-4)}` : card.bankAccountId}
												</div>
												<div className="flex gap-2 pt-1">
													<Button
														size="sm"
														variant="secondary"
														loading={cardActionId === `${card.id}:${card.status === "FROZEN" ? "unfreeze" : "freeze"}`}
														onClick={() =>
															performCardAction(card.id, card.status === "FROZEN" ? "unfreeze" : "freeze")
														}
													>
														{card.status === "FROZEN" ? "Unfreeze" : "Freeze"}
													</Button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
						<div className="mt-4 flex gap-3">
							<Button onClick={() => performAction(selectedUser.id, selectedUser.disabled ? "enable" : "disable")}>
								{selectedUser.disabled ? "Enable User" : "Disable User"}
							</Button>
							<Button variant="ghost" onClick={() => performAction(selectedUser.id, "delete")}>
								Soft Delete
							</Button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
};

export default AdminUsersPage;
