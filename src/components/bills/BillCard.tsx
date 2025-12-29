import React from "react";
import Icon from "../AppIcon";
import StatusBadge, { BillStatus } from "./StatusBadge";
import { cn } from "../../utils/cn";

export type BillPaymentListItem = {
	id: string;
	biller?: string | null;
	category?: string | null;
	amountCents: number;
	currency?: string | null;
	status: BillStatus;
	referenceNumber?: string | null;
	createdAt?: string | Date | null;
	updatedAt?: string | Date | null;
	rejectionReason?: string | null;
};

const formatCurrency = (value: number, currency: string = "USD") =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(value);

const formatDate = (value?: string | Date | null) => {
	if (!value) return "—";
	const date = typeof value === "string" ? new Date(value) : value;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
};

interface BillCardProps extends BillPaymentListItem {
	onClick?: (id: string) => void;
}

const BillCard: React.FC<BillCardProps> = ({
	id,
	biller,
	category,
	amountCents,
	currency = "USD",
	status,
	referenceNumber,
	createdAt,
	onClick,
}) => {
	const amount = amountCents / 100;
	const displayName = biller || "Biller";

	return (
		<button
			type="button"
			onClick={() => onClick?.(id)}
			className={cn(
				"w-full text-left bg-card border border-border rounded-xl shadow-card hover:shadow-card-hover transition-shadow duration-200",
				"p-4 sm:p-5 flex items-start gap-4"
			)}
		>
			<div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
				<Icon name="Receipt" size={20} color="var(--color-primary)" />
			</div>
			<div className="flex-1 min-w-0 space-y-2">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="min-w-0">
						<p className="text-base font-semibold text-foreground truncate">{displayName}</p>
						<p className="text-sm text-muted-foreground truncate">
							{category || "Bill payment"} • Ref {referenceNumber || "—"}
						</p>
					</div>
					<StatusBadge status={status} size="sm" />
				</div>

				<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
					<span className="font-medium text-foreground">{formatCurrency(amount, currency || "USD")}</span>
					<span className="text-xs text-border">•</span>
					<span>{formatDate(createdAt)}</span>
				</div>
			</div>
			<Icon name="ChevronRight" size={18} className="text-muted-foreground flex-shrink-0 mt-1" />
		</button>
	);
};

export { formatCurrency, formatDate };
export default BillCard;
