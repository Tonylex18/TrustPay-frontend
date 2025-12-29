import React from "react";
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
	{ label: string; tone: "warning" | "success" | "error" | "muted" | "info"; icon: string }
> = {
	SUBMITTED: { label: "Pending approval", tone: "warning", icon: "Clock" },
	APPROVED: { label: "Approved", tone: "info", icon: "ShieldCheck" },
	PAID: { label: "Paid", tone: "success", icon: "BadgeCheck" },
	REJECTED: { label: "Rejected", tone: "error", icon: "Ban" },
	FAILED: { label: "Failed", tone: "error", icon: "AlertTriangle" },
	DRAFT: { label: "Draft", tone: "muted", icon: "FileText" },
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
	const config = BILL_STATUS_COPY[normalized] || {
		label: normalized || "Unknown",
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
			<span className="leading-none">{config.label}</span>
		</span>
	);
};

export default StatusBadge;
