import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NavigationBar from "../../components/ui/NavigationBar";
import BreadcrumbTrail from "../../components/ui/BreadcrumbTrail";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import StepForm, { StepDefinition } from "../../components/bills/StepForm";
import BillCard, {
	type BillPaymentListItem,
	formatCurrency,
	formatDate,
} from "../../components/bills/BillCard";
import StatusBadge from "../../components/bills/StatusBadge";
import AccountSelector, { type Account } from "../../components/ui/AccountSelector";
import Icon from "../../components/AppIcon";
import { API_BASE_URL, clearStoredToken, getStoredToken } from "../../utils/api";

type BillCategory = {
	id: string;
	name: string;
	billers: { id: string; name: string; active?: boolean }[];
};

type BillPayment = BillPaymentListItem & {
	adminReviewedAt?: string | null;
	description?: string | null;
	categoryId?: string | null;
	billerId?: string | null;
};

type FormState = {
	categoryId: string;
	categoryName: string;
	billerId: string;
	customBillerName: string;
	referenceNumber: string;
	amount: string;
	note: string;
	sourceAccountId: string;
	sourceAccount: Account | null;
};

type UserState = {
	disabled: boolean;
	kycStatus: string | null;
};

const initialFormState: FormState = {
	categoryId: "",
	categoryName: "",
	billerId: "",
	customBillerName: "",
	referenceNumber: "",
	amount: "",
	note: "",
	sourceAccountId: "",
	sourceAccount: null,
};

const steps: StepDefinition[] = [
	{ id: "category", title: "Category", description: "Choose the bill type" },
	{ id: "biller", title: "Biller", description: "Select who you are paying" },
	{ id: "details", title: "Details", description: "Reference, amount, account" },
	{ id: "review", title: "Review", description: "Confirm & submit" },
];

const categoryIcons: Record<string, string> = {
	electricity: "Zap",
	water: "Droplets",
	internet: "Wifi",
	rent: "Home",
	phone: "Smartphone",
	insurance: "Shield",
};

const statusHelp: Record<string, string> = {
	SUBMITTED: "Waiting for admin approval. Funds may stay in available balance until posted.",
	PAID: "Posted to your account and settled to the biller.",
	REJECTED: "Not processed. Any holds are released.",
	FAILED: "Attempted but failed. Review and resubmit.",
};

const friendlyError = (message: string) => {
	const text = (message || "").toLowerCase();
	if (text.includes("kyc")) return "Complete KYC before submitting bill payments.";
	if (text.includes("disabled")) return "Your profile is disabled. Contact support for help.";
	if (text.includes("insufficient")) return "Insufficient available balance for this payment.";
	if (text.includes("active")) return "Select an active source account.";
	return message || "Unable to process request.";
};

const BillsPage: React.FC = () => {
	const navigate = useNavigate();
	const [categories, setCategories] = useState<BillCategory[]>([]);
	const [payments, setPayments] = useState<BillPayment[]>([]);
	const [activeStep, setActiveStep] = useState<string>("category");
	const [form, setForm] = useState<FormState>(initialFormState);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [listLoading, setListLoading] = useState<boolean>(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [stepError, setStepError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [userState, setUserState] = useState<UserState>({ disabled: false, kycStatus: null });

	const selectedCategory = useMemo(
		() => categories.find((c) => c.id === form.categoryId),
		[categories, form.categoryId]
	);
	const availableBillers = useMemo(
		() => selectedCategory?.billers || [],
		[selectedCategory]
	);

	const kycApproved = userState.kycStatus === "APPROVED";
	const submissionBlocked = userState.disabled || !kycApproved;

	const mapPayments = (payload: any[]): BillPayment[] =>
		(payload || []).map((p: any) => ({
			id: p.id,
			biller: p.biller,
			category: p.category,
			categoryId: p.categoryId,
			billerId: p.billerId,
			amountCents: Number(p.amountCents || 0),
			currency: p.currency || "USD",
			status: p.status,
			referenceNumber: p.referenceNumber,
			createdAt: p.createdAt,
			updatedAt: p.updatedAt,
			adminReviewedAt: p.adminReviewedAt || p.updatedAt,
			rejectionReason: p.rejectionReason,
			description: p.description,
		}));

	const fetchAll = useCallback(
		async (signal?: AbortSignal) => {
			const token = getStoredToken();
			if (!token) {
				navigate("/login");
				return;
			}
			setIsLoading(true);
			setLoadError(null);
			try {
				const [catRes, payRes, meRes] = await Promise.all([
					fetch(`${API_BASE_URL}/bill-categories`, {
						headers: { Authorization: `Bearer ${token}` },
						signal,
					}),
					fetch(`${API_BASE_URL}/bills/payments`, {
						headers: { Authorization: `Bearer ${token}` },
						signal,
					}),
					fetch(`${API_BASE_URL}/me`, {
						headers: { Authorization: `Bearer ${token}` },
						signal,
					}),
				]);

				if (meRes.status === 401) {
					clearStoredToken();
					navigate("/login");
					return;
				}

				const [catPayload, payPayload, mePayload] = await Promise.all([
					catRes.json().catch(() => null),
					payRes.json().catch(() => null),
					meRes.json().catch(() => null),
				]);

				if (!catRes.ok) {
					const msg = catPayload?.errors || catPayload?.message || "Unable to load bill categories.";
					setLoadError(msg);
					toast.error(msg);
					return;
				}
				setCategories(Array.isArray(catPayload) ? catPayload : []);

				if (!payRes.ok) {
					const msg = payPayload?.errors || payPayload?.message || "Unable to load bill payments.";
					setLoadError(msg);
					toast.error(msg);
				} else {
					setPayments(mapPayments(Array.isArray(payPayload) ? payPayload : []));
				}

				if (meRes.ok) {
					const me = mePayload?.user || mePayload || {};
					setUserState({
						disabled: Boolean(me.disabled),
						kycStatus: me.kycStatus || null,
					});
				}
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					const msg = "Unable to load bills data right now.";
					setLoadError(msg);
					toast.error(msg);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[navigate]
	);

	const refreshPayments = useCallback(async () => {
		const token = getStoredToken();
		if (!token) {
			navigate("/login");
			return;
		}
		setListLoading(true);
		try {
			const res = await fetch(`${API_BASE_URL}/bills/payments`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const payload = await res.json().catch(() => null);
			if (!res.ok) {
				const msg = payload?.errors || payload?.message || "Unable to refresh bill payments.";
				toast.error(msg);
				return;
			}
			setPayments(mapPayments(Array.isArray(payload) ? payload : []));
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				toast.error("Unable to refresh bill payments.");
			}
		} finally {
			setListLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		const controller = new AbortController();
		fetchAll(controller.signal);
		return () => controller.abort();
	}, [fetchAll]);

	const handleCategorySelect = (category: BillCategory) => {
		setForm((prev) => ({
			...prev,
			categoryId: category.id,
			categoryName: category.name,
			billerId: "",
			customBillerName: "",
		}));
		setActiveStep("biller");
		setStepError(null);
	};

	const handleBillerSelect = (billerId: string, name: string) => {
		setForm((prev) => ({
			...prev,
			billerId,
			customBillerName: name,
		}));
		setStepError(null);
	};

	const goToStep = (stepId: string) => {
		setActiveStep(stepId);
		setStepError(null);
		setSubmitError(null);
	};

	const handleNext = () => {
		setStepError(null);
		if (activeStep === "category") {
			if (!form.categoryId) {
				setStepError("Select a bill category to continue.");
				return;
			}
			setActiveStep("biller");
		} else if (activeStep === "biller") {
			if (!form.billerId && !form.customBillerName.trim()) {
				setStepError("Choose a biller or enter a custom name.");
				return;
			}
			setActiveStep("details");
		} else if (activeStep === "details") {
			const amountValue = Number(form.amount);
			if (!form.referenceNumber.trim()) {
				setStepError("Add the reference or account number on your bill.");
				return;
			}
			if (!Number.isFinite(amountValue) || amountValue <= 0) {
				setStepError("Enter a valid amount greater than $0.00.");
				return;
			}
			if (!form.sourceAccountId) {
				setStepError("Select the account to fund this payment.");
				return;
			}
			setActiveStep("review");
		}
	};

	const handleBack = () => {
		if (activeStep === "review") setActiveStep("details");
		else if (activeStep === "details") setActiveStep("biller");
		else if (activeStep === "biller") setActiveStep("category");
		setStepError(null);
		setSubmitError(null);
	};

	const handleSubmit = async () => {
		setSubmitError(null);
		const amountValue = Number(form.amount);

		if (submissionBlocked) {
			const msg = !kycApproved
				? "KYC approval is required before submitting bill payments."
				: "Your account is disabled. Contact support for assistance.";
			setSubmitError(msg);
			toast.error(msg);
			return;
		}

		if (
			!form.categoryId ||
			(!form.billerId && !form.customBillerName.trim()) ||
			!form.referenceNumber.trim() ||
			!Number.isFinite(amountValue) ||
			amountValue <= 0 ||
			!form.sourceAccountId
		) {
			setSubmitError("Complete all required fields before submitting.");
			return;
		}

		const token = getStoredToken();
		if (!token) {
			navigate("/login");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`${API_BASE_URL}/bills/payments`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					categoryId: form.categoryId,
					billerId: form.billerId || undefined,
					customBillerName: form.customBillerName.trim() || undefined,
					referenceNumber: form.referenceNumber.trim(),
					amount: amountValue,
					sourceAccountId: form.sourceAccountId,
					description: form.note.trim() || undefined,
				}),
			});

			const payload = await res.json().catch(() => null);
			if (!res.ok) {
				const message = friendlyError(payload?.errors || payload?.message);
				setSubmitError(message);
				toast.error(message);
				return;
			}

			toast.success("Bill payment submitted for admin approval.");
			setForm(initialFormState);
			setActiveStep("category");
			await refreshPayments();
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				const message = "Unable to submit bill payment right now.";
				setSubmitError(message);
				toast.error(message);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const statusLegend = Object.entries(statusHelp).map(([status, help]) => (
		<div key={status} className="flex items-center gap-3">
			<StatusBadge status={status} size="sm" />
			<p className="text-xs text-muted-foreground">{help}</p>
		</div>
	));

	const renderStepContent = () => {
		if (activeStep === "category") {
			return (
				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold text-foreground">Select a bill category</h3>
						<p className="text-sm text-muted-foreground">
							Choose the bill type to load the right billers and review requirements.
						</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{categories.map((category) => {
							const isSelected = category.id === form.categoryId;
							const iconName =
								categoryIcons[category.name.toLowerCase()] || "Receipt";
							return (
								<button
									key={category.id}
									type="button"
									onClick={() => handleCategorySelect(category)}
									className={`relative p-4 border rounded-lg text-left transition-all ${
										isSelected
											? "border-primary bg-primary/5 shadow-card-hover"
											: "border-border hover:border-primary/60"
									}`}
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<Icon name={iconName} size={18} color="var(--color-primary)" />
										</div>
										<div>
											<p className="text-base font-semibold text-foreground">
												{category.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{category.billers.length} billers available
											</p>
										</div>
									</div>
									{isSelected && (
										<span className="absolute top-3 right-3 text-primary" aria-hidden="true">
											<Icon name="Check" size={18} />
										</span>
									)}
								</button>
							);
						})}
						{categories.length === 0 && (
							<div className="col-span-full text-sm text-muted-foreground">
								{isLoading ? "Loading categories..." : "No bill categories available yet."}
							</div>
						)}
					</div>
					{stepError && (
						<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
							{stepError}
						</div>
					)}
					<div className="flex justify-end">
						<Button variant="default" onClick={handleNext} disabled={isLoading}>
							Continue
						</Button>
					</div>
				</div>
			);
		}

		if (activeStep === "biller") {
			return (
				<div className="space-y-5">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="text-lg font-semibold text-foreground">Select the biller</h3>
							<p className="text-sm text-muted-foreground">
								Pick a listed biller or add the name exactly as it appears on your bill.
							</p>
						</div>
						<Button variant="ghost" size="sm" onClick={() => goToStep("category")}>
							Change category
						</Button>
					</div>

					<div className="space-y-3">
						{availableBillers.length > 0 ? (
							availableBillers.map((biller) => {
								const selected = biller.id === form.billerId;
								return (
									<button
										key={biller.id}
										type="button"
										onClick={() => handleBillerSelect(biller.id, biller.name)}
										className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
											selected
												? "border-primary bg-primary/5 shadow-card"
												: "border-border hover:border-primary/60"
										}`}
									>
										<div>
											<p className="font-semibold text-foreground">{biller.name}</p>
											<p className="text-xs text-muted-foreground">Listed biller</p>
										</div>
										{selected && <Icon name="Check" size={18} className="text-primary" />}
									</button>
								);
							})
						) : (
							<div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
								No billers are listed for this category yet. You can enter a custom biller name.
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input
							label="Custom biller name"
							placeholder="e.g., Lakeside Apartments"
							value={form.customBillerName}
							onChange={(e) => {
								setForm((prev) => ({
									...prev,
									customBillerName: e.target.value,
									billerId: "",
								}));
								setStepError(null);
							}}
						/>
						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">Billers</label>
							<p className="text-xs text-muted-foreground">
								If you enter a custom biller, we will use that name for this payment only.
							</p>
						</div>
					</div>

					{stepError && (
						<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
							{stepError}
						</div>
					)}

					<div className="flex justify-between">
						<Button variant="outline" onClick={handleBack}>
							Back
						</Button>
						<Button variant="default" onClick={handleNext}>
							Continue
						</Button>
					</div>
				</div>
			);
		}

		if (activeStep === "details") {
			return (
				<div className="space-y-6">
					<div className="space-y-2">
						<h3 className="text-lg font-semibold text-foreground">Payment details</h3>
						<p className="text-sm text-muted-foreground">
							Use the reference/account number printed on your bill. Pending payments do not reduce
							available balance until approved.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input
							label="Reference / Account number"
							placeholder="Enter the account or reference number"
							value={form.referenceNumber}
							onChange={(e) => setForm((prev) => ({ ...prev, referenceNumber: e.target.value }))}
							required
						/>
						<Input
							label="Amount"
							type="number"
							placeholder="0.00"
							value={form.amount}
							min="0"
							step="0.01"
							onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
							required
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">Payment description (optional)</label>
						<textarea
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder="Visible to you and admins for audit (e.g., 'July rent, unit 12B')."
							value={form.note}
							onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
							rows={3}
						/>
					</div>

					<AccountSelector
						onSelect={(id, account) =>
							setForm((prev) => ({
								...prev,
								sourceAccountId: id,
								sourceAccount: account || null,
							}))
						}
					/>

					<div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-sm text-warning-foreground flex gap-3">
						<Icon name="Shield" size={16} className="mt-0.5 flex-shrink-0" />
						<div>
							<p className="font-semibold text-foreground">Admin approval required</p>
							<p className="text-muted-foreground">
								Submitted ≠ paid. Admins review and post the debit before funds leave your account.
								Pending items do not reduce available balance unless a hold is applied by the backend.
							</p>
						</div>
					</div>

					{stepError && (
						<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
							{stepError}
						</div>
					)}

					<div className="flex justify-between">
						<Button variant="outline" onClick={handleBack}>
							Back
						</Button>
						<Button variant="default" onClick={handleNext}>
							Continue
						</Button>
					</div>
				</div>
			);
		}

		const amountValue = Number(form.amount || 0);
		const accountNumber = form.sourceAccount?.account_number || form.sourceAccount?.accountNumber || "";
		const accountLast4 = accountNumber ? accountNumber.slice(-4) : "";
		const summaryItems = [
			{ label: "Amount", value: formatCurrency(amountValue || 0) },
			{ label: "Biller", value: form.customBillerName || "—" },
			{ label: "Category", value: form.categoryName || selectedCategory?.name || "—" },
			{ label: "Source account", value: accountLast4 ? `•••• ${accountLast4}` : "—" },
			{ label: "Reference", value: form.referenceNumber || "—" },
		];

		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">Review & submit</h3>
					<p className="text-sm text-muted-foreground">
						Confirm the bill payment details. This payment will be submitted for admin approval.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{summaryItems.map((item) => (
						<div key={item.label} className="p-4 rounded-lg border border-border bg-muted/30">
							<p className="text-xs text-muted-foreground">{item.label}</p>
							<p className="text-base font-semibold text-foreground">{item.value}</p>
						</div>
					))}
				</div>

				{form.note && (
					<div className="p-4 rounded-lg border border-border bg-muted/20">
						<p className="text-xs text-muted-foreground mb-1">Description</p>
						<p className="text-sm text-foreground">{form.note}</p>
					</div>
				)}

				<div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-sm flex gap-3">
					<Icon name="Info" size={16} className="mt-0.5 text-primary flex-shrink-0" />
					<div>
						<p className="font-semibold text-foreground">Submission notice</p>
						<p className="text-muted-foreground">
							Payments remain pending until an admin approves and posts the ledger entry. You will see
							the status update below once processed.
						</p>
					</div>
				</div>

				{submitError && (
					<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
						{submitError}
					</div>
				)}

				<div className="flex justify-between">
					<Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
						Back
					</Button>
					<Button
						variant="default"
						onClick={handleSubmit}
						loading={isSubmitting}
						disabled={submissionBlocked}
						iconName="ShieldCheck"
						iconPosition="left"
					>
						Submit for approval
					</Button>
				</div>
			</div>
		);
	};

	const breadcrumbItems = [
		{ label: "Dashboard", path: "/dashboard" },
		{ label: "Bills" },
	];

	return (
		<>
			<Helmet>
				<title>Bills - TrustPay</title>
				<meta
					name="description"
					content="Manage and submit bill payments with admin approval and clear status tracking."
				/>
			</Helmet>

			<div className="min-h-screen bg-background">
				<NavigationBar onNavigate={(path) => navigate(path)} />
				<main className="pt-nav-height">
					<div className="px-nav-margin py-8">
						<div className="max-w-6xl mx-auto space-y-8">
							<BreadcrumbTrail items={breadcrumbItems} />

							<header className="space-y-3">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
									<div>
										<h1 className="text-3xl font-bold text-foreground">Bills</h1>
										<p className="text-muted-foreground">
											Submit bill payments with clear approval states and audit-friendly details.
										</p>
									</div>
									<Button variant="ghost" size="sm" onClick={refreshPayments} loading={listLoading}>
										Refresh
									</Button>
								</div>
								<div className="p-4 rounded-xl border border-warning/30 bg-warning/10 flex gap-3">
									<Icon name="AlertCircle" size={18} className="text-warning-foreground mt-0.5" />
									<div className="space-y-1">
										<p className="text-sm font-semibold text-foreground">Status awareness</p>
										<p className="text-sm text-muted-foreground">
											Submitted ≠ paid. Pending payments stay in review until an admin posts the debit.
											Your available balance is not reduced until posting or a hold is applied.
										</p>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{statusLegend}</div>
								{loadError && (
									<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
										{loadError}
									</div>
								)}
							</header>

							<div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-6">
								<section className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<h2 className="text-xl font-semibold text-foreground">Recent bill payments</h2>
											<p className="text-sm text-muted-foreground">
												View submitted, approved, rejected, or failed payments.
											</p>
										</div>
									</div>

									<div className="space-y-3">
										{payments.length === 0 && !isLoading ? (
											<div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
												No bill payments yet. Submit your first bill on the right to see it here.
											</div>
										) : (
											payments.map((bill) => (
												<BillCard
													key={bill.id}
													{...bill}
													onClick={(id) => navigate(`/bills/${id}`)}
												/>
											))
										)}
										{isLoading && (
											<div className="text-sm text-muted-foreground">Loading bills...</div>
										)}
									</div>
								</section>

								<section>
									<StepForm
										steps={steps}
										activeStep={activeStep}
										onStepChange={(next) => {
											// Only allow navigating back or staying on the same/previous step
											const order = steps.map((s) => s.id);
											if (order.indexOf(next) <= order.indexOf(activeStep)) {
												goToStep(next);
											}
										}}
									>
										{renderStepContent()}
									</StepForm>
								</section>
							</div>

							{payments.length > 0 && (
								<section className="space-y-3">
									<h3 className="text-sm font-semibold text-foreground">Audit tips</h3>
									<ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
										<li className="p-3 rounded-lg border border-border bg-muted/30">
											Status chips show if a payment is pending approval, paid, rejected, or failed.
										</li>
										<li className="p-3 rounded-lg border border-border bg-muted/30">
											Click any bill to view reference numbers, review timestamps, and rejection reasons.
										</li>
										<li className="p-3 rounded-lg border border-border bg-muted/30">
											Refreshing pulls the latest state from the backend—no client-side balance edits.
										</li>
									</ul>
								</section>
							)}
						</div>
					</div>
				</main>
			</div>
		</>
	);
};

export default BillsPage;
