import React from "react";
import { cn } from "../../utils/cn";

export type StepDefinition = {
	id: string;
	title: string;
	description?: string;
	disabled?: boolean;
};

interface StepFormProps {
	steps: StepDefinition[];
	activeStep: string;
	onStepChange?: (id: string) => void;
	children: React.ReactNode;
}

const StepForm: React.FC<StepFormProps> = ({ steps, activeStep, onStepChange, children }) => {
	const activeIndex = Math.max(
		0,
		steps.findIndex((s) => s.id === activeStep)
	);

	return (
		<div className="space-y-6">
			<div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card">
				<ol className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
					{steps.map((step, index) => {
						const isCompleted = index < activeIndex;
						const isActive = index === activeIndex;
						return (
							<li key={step.id} className="flex items-center gap-3">
								<button
									type="button"
									disabled={!onStepChange || step.disabled || (!isCompleted && !isActive)}
									onClick={() => onStepChange?.(step.id)}
									className={cn(
										"w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold transition-colors",
										isActive
											? "bg-primary text-primary-foreground border-primary"
											: isCompleted
											? "bg-success/10 text-success-foreground border-success/30"
											: "bg-muted text-muted-foreground border-border",
										(!onStepChange || step.disabled) && "cursor-default"
									)}
									aria-current={isActive ? "step" : undefined}
								>
									{isCompleted ? "✓" : index + 1}
								</button>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-foreground truncate">{step.title}</p>
									{step.description && (
										<p className="text-xs text-muted-foreground truncate">{step.description}</p>
									)}
								</div>
							</li>
						);
					})}
				</ol>
			</div>

			<div className="bg-card border border-border rounded-xl shadow-card p-4 sm:p-6">{children}</div>
		</div>
	);
};

export default StepForm;
