import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";

export type BillStatus =
	| "SUBMITTED"
	| "APPROVED"
	| "PAID"
	| "REJECTED"
	| "FAILED"
	| "DRAFT"
	| string;

export const BILL_STATUS_COPY: Record<
	string,
	{ key: string; tone: "warning" | "success" | "error" | "muted" | "info"; icon: string }
> = {
	SUBMITTED: { key: "statusBadge.SUBMITTED", tone: "warning", icon: "Clock" },
	APPROVED: { key: "statusBadge.APPROVED", tone: "info", icon: "ShieldCheck" },
	PAID: { key: "statusBadge.PAID", tone: "success", icon: "BadgeCheck" },
		REJECTED: { key: "statusBadge.REJECTED", tone: "error", icon: "Ban" },
	FAILED: { key: "statusBadge.FAILED", tone: "error", icon: "AlertTriangle" },
	DRAFT: { key: "statusBadge.DRAFT", tone: "muted", icon: "FileText" },
};

const toneClassNames: Record<string, string> = {
	warning: "bg-warning/10 text-warning-foreground border-warning/30",
	success: "bg-success/10 text-success-foreground border-success/25",
	error: "bg-error/10 text-error-foreground border-error/30",
	info: "bg-primary/10 text-primary border-primary/25",
	muted: "bg-muted text-muted-foreground border-border",
};

interface StatusBadgeProps {
	status: BillStatus;
	size?: "sm" | "md";
	className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md", className }) => {
	const normalized = (status || "").toUpperCase();
	const { t } = useTranslation("bills");
	const config = BILL_STATUS_COPY[normalized] || {
		key: "statusBadge.UNKNOWN",
		tone: "muted",
		icon: "Info",
	};

	const baseClasses =
		"inline-flex items-center gap-2 rounded-full border font-medium transition-colors duration-200";
	const sizeClasses = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
	const toneClasses = toneClassNames[config.tone] || toneClassNames.muted;

	return (
		<span className={cn(baseClasses, sizeClasses, toneClasses, className)}>
			<Icon name={config.icon} size={size === "sm" ? 14 : 16} />
			<span className="leading-none">{t(config.key)}</span>
		</span>
	);
};

export default StatusBadge;
