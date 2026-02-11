import * as React from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
} from "./alert-dialog";

export interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "destructive";
}

const ConfirmDialog = React.forwardRef<
	React.ElementRef<typeof AlertDialogContent>,
	ConfirmDialogProps
>(
	(
		{
			open,
			onOpenChange,
			title,
			description,
			onConfirm,
			onCancel,
			confirmText = "Confirm",
			cancelText = "Cancel",
			variant = "default",
		},
		ref,
	) => {
		const handleConfirm = () => {
			onConfirm();
			onOpenChange(false);
		};

		const handleCancel = () => {
			onCancel?.();
			onOpenChange(false);
		};

		return (
			<AlertDialog open={open} onOpenChange={onOpenChange}>
				<AlertDialogContent ref={ref}>
					<AlertDialogHeader>
						<AlertDialogTitle>{title}</AlertDialogTitle>
						<AlertDialogDescription>{description}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancel}>
							{cancelText}
						</AlertDialogCancel>
	<AlertDialogAction
		onClick={handleConfirm}
		className={variant === "destructive" ? "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40" : undefined}
	>
		{confirmText}
	</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	},
);

ConfirmDialog.displayName = "ConfirmDialog";

export { ConfirmDialog };