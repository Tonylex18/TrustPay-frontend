import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import NavigationBar from "../../components/ui/NavigationBar";
import BreadcrumbTrail from "../../components/ui/BreadcrumbTrail";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/bills/StatusBadge";
import { formatCurrency, formatDate } from "../../components/bills/BillCard";
import Icon from "../../components/AppIcon";
import { API_BASE_URL, clearStoredToken, getStoredToken } from "../../utils/api";
import { apiFetch } from "utils/apiFetch";

type BillPaymentDetail = {
	id: string;
	status: string;
	biller?: string | null;
	category?: string | null;
	amountCents: number;
	currency?: string | null;
	referenceNumber?: string | null;
	createdAt?: string | Date | null;
	updatedAt?: string | Date | null;
	adminReviewedAt?: string | Date | null;
	rejectionReason?: string | null;
	description?: string | null;
};

const BillPaymentDetailsPage: React.FC = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation("bills");
	const [bill, setBill] = useState<BillPaymentDetail | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const mapPayment = (p: any): BillPaymentDetail => ({
		id: p.id,
		status: p.status,
		biller: p.biller,
		category: p.category,
		amountCents: Number(p.amountCents || 0),
		currency: p.currency || "USD",
		referenceNumber: p.referenceNumber,
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
		adminReviewedAt: p.adminReviewedAt || p.updatedAt,
		rejectionReason: p.rejectionReason,
		description: p.description,
	});

	const fetchPayment = useCallback(async () => {
		const token = getStoredToken();
		if (!token) {
			navigate("/login");
			return;
		}
		if (!id) {
			navigate("/bills");
			return;
		}
		setIsLoading(true);
		setLoadError(null);
		try {
			const res = await apiFetch(`${API_BASE_URL}/bills/payments`, {
			});
			if (res.status === 401) {
				clearStoredToken();
				navigate("/login");
				return;
			}
			const payload = await res.json().catch(() => null);
			if (!res.ok) {
				const msg = payload?.errors || payload?.message || t("errors.loadPayment");
				setLoadError(msg);
				toast.error(msg);
				return;
			}
			const list = Array.isArray(payload) ? payload : [];
			const found = list.find((p) => p.id === id);
			if (!found) {
				setLoadError(t("errors.billNotFound"));
				return;
			}
			setBill(mapPayment(found));
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				const msg = t("errors.loadPayment");
				setLoadError(msg);
				toast.error(msg);
			}
		} finally {
			setIsLoading(false);
		}
	}, [id, navigate, t]);

	useEffect(() => {
		fetchPayment();
	}, [fetchPayment]);

	const breadcrumbItems = [
		{ label: t("breadcrumb.dashboard"), path: "/dashboard" },
		{ label: t("breadcrumb.bills"), path: "/bills" },
		{ label: t("breadcrumb.details") },
	];

	const details: { label: string; value: React.ReactNode }[] = [
		{ label: t("labels.category"), value: bill?.category || "—" },
		{ label: t("labels.biller"), value: bill?.biller || "—" },
		{ label: t("labels.reference"), value: bill?.referenceNumber || "—" },
		{ label: t("labels.created"), value: formatDate(bill?.createdAt, i18n.language) },
		{
			label: t("detailsPage.adminReviewDate"),
			value: bill?.adminReviewedAt ? formatDate(bill.adminReviewedAt, i18n.language) : t("detailsPage.pending"),
		},
		{ label: t("table.status"), value: bill?.status ? <StatusBadge status={bill.status} /> : "—" },
	];

	return (
		<>
			<Helmet>
				<title>{t("detailsPage.metaTitle")}</title>
				<meta name="description" content={t("detailsPage.metaDescription")} />
			</Helmet>
			<div className="min-h-screen bg-background">
				<NavigationBar onNavigate={(path) => navigate(path)} />
				<main className="pt-nav-height">
					<div className="px-nav-margin py-8">
						<div className="max-w-5xl mx-auto space-y-6">
							<BreadcrumbTrail items={breadcrumbItems} />

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<h1 className="text-3xl font-bold text-foreground">{t("detailsPage.title")}</h1>
									<p className="text-muted-foreground">
										{t("detailsPage.subtitle")}
									</p>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" onClick={() => navigate("/bills")}>
										{t("detailsPage.back")}
									</Button>
									<Button variant="ghost" size="sm" onClick={fetchPayment} loading={isLoading}>
										{t("detailsPage.refresh")}
									</Button>
								</div>
							</div>

							<div className="p-4 rounded-xl border border-warning/30 bg-warning/10 flex gap-3">
								<Icon name="ShieldAlert" size={18} className="text-warning-foreground mt-0.5" />
								<div className="space-y-1">
									<p className="text-sm font-semibold text-foreground">{t("detailsPage.statusTitle")}</p>
									<p className="text-sm text-muted-foreground">
										{t("detailsPage.statusBody")}
									</p>
								</div>
							</div>

							{loadError && (
								<div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
									{loadError}
								</div>
							)}

							{isLoading && <div className="text-sm text-muted-foreground">{t("detailsPage.loading")}</div>}

							{!isLoading && bill && (
								<div className="space-y-6">
									<div className="bg-card border border-border rounded-xl shadow-card p-5 flex flex-col gap-4">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
											<div>
												<p className="text-sm text-muted-foreground">{t("detailsPage.amount")}</p>
												<p className="text-3xl font-bold text-foreground">
													{formatCurrency(bill.amountCents / 100, bill.currency || "USD", i18n.language)}
												</p>
											</div>
											{bill.status && <StatusBadge status={bill.status} />}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											{details.map((item) => (
												<div key={item.label} className="p-3 rounded-lg border border-border bg-muted/30">
													<p className="text-xs text-muted-foreground">{item.label}</p>
													<p className="text-sm font-semibold text-foreground">
														{typeof item.value === "string" || typeof item.value === "number"
															? item.value
															: item.value}
													</p>
												</div>
											))}
										</div>
									</div>

									{bill.description && (
										<div className="bg-card border border-border rounded-xl shadow-card p-4">
											<p className="text-xs text-muted-foreground mb-2">{t("detailsPage.paymentDescription")}</p>
											<p className="text-sm text-foreground">{bill.description}</p>
										</div>
									)}

									{bill.rejectionReason && (
										<div className="bg-error/5 border border-error/30 rounded-xl p-4">
											<p className="text-sm font-semibold text-error">{t("detailsPage.rejectionReason")}</p>
											<p className="text-sm text-error mt-1">{bill.rejectionReason}</p>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</>
	);
};

export default BillPaymentDetailsPage;
