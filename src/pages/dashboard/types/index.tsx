export interface Account {
	id: string;
	type: "checking" | "savings" | "credit";
	balance: number;
	accountNumber: string;
	currency: string;
	routingNumber?: string;
}

export interface Transaction {
	id: string;
	date: Date;
	description: string;
	amount: number;
	type: "credit" | "debit";
	category: string;
	status: "completed" | "pending" | "failed";
}

export interface QuickActionConfig {
	label: string;
	icon: string;
	onClick: () => void;
	variant?: "default" | "outline" | "secondary";
	description?: string;
}

export interface User {
	name?: string;
	email: string;
	avatar?: string;
}

export interface DashboardData {
	user?: User;
	primaryAccount?: Account | null;
	accounts: Account[];
	recentTransactions: Transaction[];
}
