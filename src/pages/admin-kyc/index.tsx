import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL, getStoredToken } from "../../utils/api";
import NavigationBar from "../../components/ui/NavigationBar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Icon from "../../components/AppIcon";

type KycRecord = {
	id: string;
	userId: string;
	email: string;
	fullName: string;
	documentType: string;
	documentNumber: string;
	country: string;
	submittedAt: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	rejectionReason?: string | null;
};

const AdminKycReview: React.FC = () => {
	const navigate = useNavigate();
	const [kycRecords, setKycRecords] = useState<KycRecord[]>([]);
	const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
	const [loading, setLoading] = useState(false);
	const [actionTarget, setActionTarget] = useState<KycRecord | null>(null);
	const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
	const [reason, setReason] = useState("");

	const token = getStoredToken();

	useEffect(() => {
		if (!token) {
			navigate("/admin");
			return;
		}
		const controller = new AbortController();
		const fetchKyc = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${API_BASE_URL}/admin/kyc`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				const payload = await res.json().catch(() => []);
				if (!res.ok) {
					if (res.status === 401 || res.status === 403) navigate("/admin");
					const msg = payload?.errors || payload?.message || "Unable to load KYC submissions.";
					toast.error(msg);
					return;
				}
				setKycRecords(Array.isArray(payload) ? payload : []);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					toast.error("Unable to load KYC submissions.");
				}
			} finally {
				setLoading(false);
			}
		};
		fetchKyc();
		return () => controller.abort();
	}, [navigate, token]);

	const filtered = useMemo(() => {
		if (filter === "ALL") return kycRecords;
		return kycRecords.filter((k) => k.status === filter);
	}, [filter, kycRecords]);

	const beginDecision = (record: KycRecord, action: "APPROVE" | "REJECT") => {
		setActionTarget(record);
		setDecision(action);
		setReason("");
	};

	const submitDecision = async () => {
		if (!token || !actionTarget || !decision) return;
		if (decision === "REJECT" && !reason.trim()) {
			toast.error("Provide a rejection reason.");
			return;
		}
		try {
			const res = await fetch(`${API_BASE_URL}/admin/kyc/${actionTarget.id}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
					rejectionReason: decision === "REJECT" ? reason : undefined,
				}),
			});
			const payload = await res.json().catch(() => null);
			if (!res.ok) {
				const msg = payload?.errors || payload?.message || "Unable to update KYC.";
				toast.error(msg);
				return;
			}
			setKycRecords((prev) =>
				prev.map((k) =>
					k.id === actionTarget.id
						? {
								...k,
								status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
								rejectionReason: decision === "REJECT" ? reason : k.rejectionReason,
						  }
						: k
				)
			);
			toast.success(`KYC ${decision === "APPROVE" ? "approved" : "rejected"}.`);
			setActionTarget(null);
			setDecision(null);
		} catch {
			toast.error("Unable to update KYC.");
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<NavigationBar user={undefined} onNavigate={(path) => navigate(path)} />
			<main className="pt-nav-height px-nav-margin py-8 max-w-6xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Admin</p>
						<h1 className="text-3xl font-bold text-foreground">KYC Review</h1>
					</div>
					<Button variant="secondary" onClick={() => navigate("/admin")}>
						Back to Admin Home
					</Button>
				</div>

				<div className="bg-card border border-border rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-end">
					<div className="w-full sm:w-48">
						<Select
							label="Status"
							value={filter}
							onChange={(val) => setFilter(val as any)}
							options={[
								{ label: "Pending", value: "PENDING" },
								{ label: "Approved", value: "APPROVED" },
								{ label: "Rejected", value: "REJECTED" },
								{ label: "All", value: "ALL" },
							]}
						/>
					</div>
					<p className="text-sm text-muted-foreground">
						Showing {filtered.length} of {kycRecords.length} submissions
					</p>
				</div>

				<div className="bg-card border border-border rounded-2xl p-4 shadow-card">
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading KYC submissions...</p>
					) : filtered.length === 0 ? (
						<p className="text-sm text-muted-foreground">No KYC submissions for this filter.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead className="text-left text-muted-foreground">
									<tr>
										<th className="py-2 pr-4">User</th>
										<th className="py-2 pr-4">Document</th>
										<th className="py-2 pr-4">Country</th>
										<th className="py-2 pr-4">Submitted</th>
										<th className="py-2 pr-4">Status</th>
										<th className="py-2 pr-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/60">
									{filtered.map((k) => (
										<tr key={k.id}>
											<td className="py-3 pr-4">
												<div className="font-semibold text-foreground">{k.fullName || "—"}</div>
												<div className="text-xs text-muted-foreground">{k.email}</div>
											</td>
											<td className="py-3 pr-4">
												<div className="font-medium text-foreground">
													{k.documentType.toUpperCase()}
												</div>
												<div className="text-xs text-muted-foreground">{k.documentNumber}</div>
											</td>
											<td className="py-3 pr-4">{k.country}</td>
											<td className="py-3 pr-4">
												{new Date(k.submittedAt).toLocaleString()}
											</td>
											<td className="py-3 pr-4">
												<span
													className={`px-2 py-1 rounded-full text-xs font-semibold ${
														k.status === "PENDING"
															? "bg-amber-100 text-amber-800"
															: k.status === "APPROVED"
															? "bg-emerald-100 text-emerald-800"
															: "bg-rose-100 text-rose-800"
													}`}
												>
													{k.status}
												</span>
												{k.rejectionReason && (
													<div className="text-[11px] text-muted-foreground mt-1">
														Reason: {k.rejectionReason}
													</div>
												)}
											</td>
											<td className="py-3 pr-4 text-right space-x-2">
												<Button
													size="sm"
													variant="secondary"
													disabled={k.status !== "PENDING"}
													onClick={() => beginDecision(k, "APPROVE")}
												>
													Approve
												</Button>
												<Button
													size="sm"
													variant="ghost"
													disabled={k.status !== "PENDING"}
													onClick={() => beginDecision(k, "REJECT")}
												>
													Reject
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</main>

			{actionTarget && decision && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-card border border-border rounded-xl p-5 w-full max-w-md shadow-xl">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold text-foreground">
								{decision === "APPROVE" ? "Approve KYC" : "Reject KYC"}
							</h3>
							<button onClick={() => setActionTarget(null)}>
								<Icon name="X" />
							</button>
						</div>
						<p className="text-sm text-muted-foreground mb-4">
							{actionTarget.fullName} — {actionTarget.email}
						</p>
						{decision === "REJECT" && (
							<Input
								label="Rejection reason"
								placeholder="Reason is required"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							/>
						)}
						<div className="mt-4 flex justify-end gap-3">
							<Button variant="ghost" onClick={() => setActionTarget(null)}>
								Cancel
							</Button>
							<Button onClick={submitDecision}>
								{decision === "APPROVE" ? "Approve" : "Reject"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminKycReview;
