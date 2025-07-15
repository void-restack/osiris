import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";

type Database = {
	id: number;
	name: string;
	host: string;
	lastActivity: string;
	status: "Active" | "Idle" | "Error";
};

export function EditDatabaseSidebar() {
	const { selectedDatabase, closeEditSidebar, updateSelectedDatabase } =
		useAppStore();

	// Local form state
	const [formData, setFormData] = useState<Database | null>(null);
	const [hasChanges, setHasChanges] = useState(false);

	// Initialize form when selectedDatabase changes
	useEffect(() => {
		if (selectedDatabase) {
			setFormData({ ...selectedDatabase });
			setHasChanges(false);
		}
	}, [selectedDatabase]);

	// Track changes
	useEffect(() => {
		if (formData && selectedDatabase) {
			const changed =
				formData.name !== selectedDatabase.name ||
				formData.host !== selectedDatabase.host ||
				formData.status !== selectedDatabase.status;
			setHasChanges(changed);
		}
	}, [formData, selectedDatabase]);

	const handleInputChange = (field: keyof Database, value: string) => {
		if (formData) {
			setFormData({ ...formData, [field]: value });
		}
	};

	const handleSave = () => {
		if (formData && hasChanges) {
			// Update the store with the new data
			updateSelectedDatabase(formData);

			// Here you would typically also save to your backend
			// await saveDatabase(formData);

			setHasChanges(false);

			// You might want to show a success toast here
			console.log("Database updated:", formData);
		}
	};

	const handleCancel = () => {
		if (hasChanges) {
			// You might want to show a confirmation dialog here
			const confirmDiscard = window.confirm("Discard unsaved changes?");
			if (!confirmDiscard) return;
		}
		closeEditSidebar();
	};

	if (!selectedDatabase || !formData) {
		return null;
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-primary-100 border-b p-6">
				<div>
					<h2 className="font-semibold text-lg text-primary-800">
						Edit Database
					</h2>
					<p className="text-primary-400 text-sm">
						Configure database connection settings
					</p>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleCancel}
					className="h-8 w-8 p-0"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Form Content */}
			<div className="flex-1 space-y-6 overflow-y-auto p-6">
				{/* Database ID - Read only */}
				<div className="space-y-2">
					<Label
						htmlFor="database-id"
						className="font-medium text-primary-700 text-sm"
					>
						Database ID
					</Label>
					<div className="rounded-md bg-primary-50 px-3 py-2 font-mono text-primary-400 text-sm">
						#{formData.id}
					</div>
				</div>

				{/* Database Name */}
				<div className="space-y-2">
					<Label
						htmlFor="database-name"
						className="font-medium text-primary-700 text-sm"
					>
						Database Name
					</Label>
					<Input
						id="database-name"
						value={formData.name}
						onChange={(e) => handleInputChange("name", e.target.value)}
						placeholder="Enter database name"
						className="w-full"
					/>
				</div>

				{/* Host */}
				<div className="space-y-2">
					<Label
						htmlFor="database-host"
						className="font-medium text-primary-700 text-sm"
					>
						Host
					</Label>
					<Input
						id="database-host"
						value={formData.host}
						onChange={(e) => handleInputChange("host", e.target.value)}
						placeholder="Enter host URL"
						className="w-full font-mono text-sm"
					/>
				</div>

				{/* Status */}
				<div className="space-y-2">
					<Label
						htmlFor="database-status"
						className="font-medium text-primary-700 text-sm"
					>
						Status
					</Label>
					<Select
						value={formData.status}
						onValueChange={(value) =>
							handleInputChange("status", value as Database["status"])
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Active">Active</SelectItem>
							<SelectItem value="Idle">Idle</SelectItem>
							<SelectItem value="Error">Error</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Last Activity - Read only */}
				<div className="space-y-2">
					<Label
						htmlFor="last-activity"
						className="font-medium text-primary-700 text-sm"
					>
						Last Activity
					</Label>
					<div className="rounded-md bg-primary-50 px-3 py-2 text-primary-400 text-sm">
						{formData.lastActivity}
					</div>
				</div>
			</div>

			{/* Footer Actions */}
			<div className="border-primary-100 border-t p-6">
				<div className="flex gap-3">
					<Button
						onClick={handleSave}
						disabled={!hasChanges}
						className="flex-1"
						size="sm"
					>
						<Save className="mr-2 h-4 w-4" />
						Save Changes
					</Button>
					<Button
						variant="outline"
						onClick={handleCancel}
						size="sm"
						className="flex-1"
					>
						Cancel
					</Button>
				</div>
				{hasChanges && (
					<p className="mt-2 text-center text-amber-600 text-xs">
						You have unsaved changes
					</p>
				)}
			</div>
		</div>
	);
}
