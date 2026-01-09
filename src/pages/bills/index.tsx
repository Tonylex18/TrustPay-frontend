import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { API_BASE_URL, getStoredToken } from "../../utils/api";
import { apiFetch } from "utils/apiFetch";

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

const categoryIcons: Record<string, string> = {
	electricity: "Zap",
	water: "Droplets",
	internet: "Wifi",
	rent: "Home",
	phone: "Smartphone",
	insurance: "Shield",
};

const friendlyError = (message: string, t: (key: string) => string) => {
	const text = (message || "").toLowerCase();
	if (text.includes("kyc")) return t("friendly.kyc");
	if (text.includes("disabled")) return t("friendly.disabled");
	if (text.includes("insufficient")) return t("friendly.insufficient");
	if (text.includes("active")) return t("friendly.active");
	return message || t("friendly.fallback");
};

const BillsPage: React.FC = () => {
	const navigate = useNavigate();
	const { t, i18n } = useTranslation("bills");
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
	const steps: StepDefinition[] = useMemo(
		() => [
			{ id: "category", title: t("steps.category.title"), description: t("steps.category.description") },
			{ id: "biller", title: t("steps.biller.title"), description: t("steps.biller.description") },
			{ id: "details", title: t("steps.details.title"), description: t("steps.details.description") },
			{ id: "review", title: t("steps.review.title"), description: t("steps.review.description") },
		],
		[t]
	);

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
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			setLoadError(null);
			try {
				const [catRes, payRes, meRes] = await Promise.all([
					apiFetch(`${API_BASE_URL}/bill-categories`, {
						signal,
					}),
					apiFetch(`${API_BASE_URL}/bills/payments`, {
						signal,
					}),
					apiFetch(`${API_BASE_URL}/me`, {
						signal,
					}),
				]);

					const [catPayload, payPayload, mePayload] = await Promise.all([
						catRes.json().catch(() => null),
						payRes.json().catch(() => null),
					meRes.json().catch(() => null),
				]);

				if (!catRes.ok) {
					const msg = catPayload?.errors || catPayload?.message || t("errors.loadCategories");
					setLoadError(msg);
					toast.error(msg);
					return;
				}
				setCategories(Array.isArray(catPayload) ? catPayload : []);

				if (!payRes.ok) {
					const msg = payPayload?.errors || payPayload?.message || t("errors.loadPayments");
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
					const msg = t("errors.loadPayments");
					setLoadError(msg);
					toast.error(msg);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[navigate, t]
	);

		const refreshPayments = useCallback(async () => {
			const token = getStoredToken();
			if (!token) {
				return;
			}
			setListLoading(true);
			try {
			const res = await apiFetch(`${API_BASE_URL}/bills/payments`, {
		});
			const payload = await res.json().catch(() => null);
			if (!res.ok) {
				const msg = payload?.errors || payload?.message || t("errors.refreshPayments");
				toast.error(msg);
				return;
			}
			setPayments(mapPayments(Array.isArray(payload) ? payload : []));
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				toast.error(t("errors.refreshPayments"));
			}
		} finally {
			setListLoading(false);
		}
	}, [navigate, t]);

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
			setStepError(t("errors.selectCategory"));
			return;
		}
		setActiveStep("biller");
	} else if (activeStep === "biller") {
		if (!form.billerId && !form.customBillerName.trim()) {
			setStepError(t("errors.selectBiller"));
			return;
		}
		setActiveStep("details");
	} else if (activeStep === "details") {
		const amountValue = Number(form.amount);
		if (!form.referenceNumber.trim()) {
			setStepError(t("errors.referenceRequired"));
			return;
		}
		if (!Number.isFinite(amountValue) || amountValue <= 0) {
			setStepError(t("errors.amountInvalid"));
			return;
		}
		if (!form.sourceAccountId) {
			setStepError(t("errors.accountRequired"));
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
			? t("errors.kycRequired")
			: t("errors.disabledProfile");
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
			setSubmitError(t("errors.completeFields"));
			return;
		}

			setIsSubmitting(true);
			try {
			const res = await apiFetch(`${API_BASE_URL}/bills/payments`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
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
				const message = friendlyError(payload?.errors || payload?.message, t);
				setSubmitError(message);
				toast.error(message);
				return;
			}

			toast.success(t("success.submitted"));
			setForm(initialFormState);
			setActiveStep("category");
			await refreshPayments();
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				const message = t("errors.submitFailed");
				setSubmitError(message);
				toast.error(message);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const statusLegend = Object.entries(t("statusHelp", { returnObjects: true }) as Record<string, string>).map(([status, help]) => (
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
						<h3 className="text-lg font-semibold text-foreground">{t("steps.selectCategoryTitle")}</h3>
						<p className="text-sm text-muted-foreground">{t("steps.selectCategorySubtitle")}</p>
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
												{t("steps.billersAvailable", { count: category.billers.length })}
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
								{isLoading ? t("steps.loadingCategories") : t("steps.noCategories")}
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
							{t("steps.continue")}
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
							<h3 className="text-lg font-semibold text-foreground">{t("steps.selectBillerTitle")}</h3>
							<p className="text-sm text-muted-foreground">{t("steps.selectBillerSubtitle")}</p>
						</div>
						<Button variant="ghost" size="sm" onClick={() => goToStep("category")}>
							{t("steps.changeCategory")}
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
											<p className="text-xs text-muted-foreground">{t("steps.listedBiller")}</p>
										</div>
										{selected && <Icon name="Check" size={18} className="text-primary" />}
									</button>
								);
							})
						) : (
							<div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
								{t("steps.noBillers")}
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input
							label={t("steps.customBiller")}
							placeholder={t("steps.customBillerPlaceholder")}
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
							<label className="text-sm font-medium text-foreground">{t("steps.billersLabel")}</label>
							<p className="text-xs text-muted-foreground">{t("steps.customBillerInfo")}</p>
						</div>
					</div>

					{stepError && (
						<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
							{stepError}
						</div>
					)}

					<div className="flex justify-between">
						<Button variant="outline" onClick={handleBack}>
							{t("steps.back")}
						</Button>
						<Button variant="default" onClick={handleNext}>
							{t("steps.continue")}
						</Button>
					</div>
				</div>
			);
		}

		if (activeStep === "details") {
			return (
				<div className="space-y-6">
					<div className="space-y-2">
						<h3 className="text-lg font-semibold text-foreground">{t("steps.detailsIntroTitle")}</h3>
						<p className="text-sm text-muted-foreground">{t("steps.detailsIntroBody")}</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Input
							label={t("steps.referenceLabel")}
							placeholder={t("steps.referencePlaceholder")}
							value={form.referenceNumber}
							onChange={(e) => setForm((prev) => ({ ...prev, referenceNumber: e.target.value }))}
							required
						/>
						<Input
							label={t("steps.amountLabel")}
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
						<label className="text-sm font-medium text-foreground">{t("steps.paymentDescriptionLabel")}</label>
						<textarea
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder={t("steps.paymentDescriptionPlaceholder")}
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
							<p className="font-semibold text-foreground">{t("steps.adminApprovalTitle")}</p>
							<p className="text-muted-foreground">{t("steps.adminApprovalBody")}</p>
						</div>
					</div>

					{stepError && (
						<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
							{stepError}
						</div>
					)}

					<div className="flex justify-between">
						<Button variant="outline" onClick={handleBack}>
							{t("steps.back")}
						</Button>
						<Button variant="default" onClick={handleNext}>
							{t("steps.continue")}
						</Button>
					</div>
				</div>
			);
		}

		const amountValue = Number(form.amount || 0);
		const accountNumber = form.sourceAccount?.account_number || form.sourceAccount?.accountNumber || "";
		const accountLast4 = accountNumber ? accountNumber.slice(-4) : "";
		const summaryCurrency = form.sourceAccount?.currency || "USD";
		const summaryItems = [
			{ label: t("labels.amount"), value: formatCurrency(amountValue || 0, summaryCurrency, i18n.language) },
			{ label: t("labels.biller"), value: form.customBillerName || "—" },
			{ label: t("labels.category"), value: form.categoryName || selectedCategory?.name || "—" },
			{ label: t("labels.sourceAccount"), value: accountLast4 ? `•••• ${accountLast4}` : "—" },
			{ label: t("labels.reference"), value: form.referenceNumber || "—" },
		];

		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">{t("review.summaryTitle")}</h3>
					<p className="text-sm text-muted-foreground">{t("review.summarySubtitle")}</p>
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
						<p className="text-xs text-muted-foreground mb-1">{t("labels.description")}</p>
						<p className="text-sm text-foreground">{form.note}</p>
					</div>
				)}

				<div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-sm flex gap-3">
					<Icon name="Info" size={16} className="mt-0.5 text-primary flex-shrink-0" />
					<div>
						<p className="font-semibold text-foreground">{t("review.noticeTitle")}</p>
						<p className="text-muted-foreground">{t("review.noticeBody")}</p>
					</div>
				</div>

				{submitError && (
					<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
						{submitError}
					</div>
				)}

				<div className="flex justify-between">
					<Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
						{t("steps.back")}
					</Button>
					<Button
						variant="default"
						onClick={handleSubmit}
						loading={isSubmitting}
						disabled={submissionBlocked}
						iconName="ShieldCheck"
						iconPosition="left"
					>
						{t("review.submitCta")}
					</Button>
				</div>
			</div>
		);
	};

	const breadcrumbItems = [
		{ label: t("breadcrumb.dashboard"), path: "/dashboard" },
		{ label: t("breadcrumb.bills") },
	];

	return (
		<>
			<Helmet>
				<title>{t("meta.title")}</title>
				<meta name="description" content={t("meta.description")} />
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
										<h1 className="text-3xl font-bold text-foreground">{t("page.title")}</h1>
										<p className="text-muted-foreground">{t("page.subtitle")}</p>
									</div>
									<Button variant="ghost" size="sm" onClick={refreshPayments} loading={listLoading}>
										{t("page.refresh")}
									</Button>
								</div>
								<div className="p-4 rounded-xl border border-warning/30 bg-warning/10 flex gap-3">
									<Icon name="AlertCircle" size={18} className="text-warning-foreground mt-0.5" />
									<div className="space-y-1">
										<p className="text-sm font-semibold text-foreground">{t("page.statusLegendTitle")}</p>
										<p className="text-sm text-muted-foreground">{t("page.statusLegendBody")}</p>
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
											<h2 className="text-xl font-semibold text-foreground">{t("list.title")}</h2>
											<p className="text-sm text-muted-foreground">{t("list.subtitle")}</p>
										</div>
									</div>

									<div className="space-y-3">
										{payments.length === 0 && !isLoading ? (
											<div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
												{t("list.empty")}
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
											<div className="text-sm text-muted-foreground">{t("list.loading")}</div>
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
									<h3 className="text-sm font-semibold text-foreground">{t("list.auditTitle")}</h3>
									<ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
										<li className="p-3 rounded-lg border border-border bg-muted/30">
											{t("list.audit1")}
										</li>
										<li className="p-3 rounded-lg border border-border bg-muted/30">
											{t("list.audit2")}
										</li>
										<li className="p-3 rounded-lg border border-border bg-muted/30">
											{t("list.audit3")}
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
