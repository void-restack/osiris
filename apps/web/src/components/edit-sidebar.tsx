import { X } from "lucide-react";
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

	const [formData, setFormData] = useState<Database | null>(null);
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		if (selectedDatabase) {
			setFormData({ ...selectedDatabase });
			setHasChanges(false);
		}
	}, [selectedDatabase]);

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
			updateSelectedDatabase(formData);

			// await saveDatabase(formData);

			setHasChanges(false);

			console.log("Database updated:", formData);
		}
	};

	const handleCancel = () => {
		if (hasChanges) {
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
			<div className="flex items-center justify-between rounded-t-xl border-b border-b-dashed border-b-primary-100 bg-primary-25 p-6.5">
				<div>
					<span className="text-primary-300">Postgres / </span>
					<span>{formData.name}</span>
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

			<div className="flex-1 space-y-6 overflow-y-auto p-6">
				<div className="space-y-[6px]">
					<Label htmlFor="database-id" className="text-[13px] text-primary-400">
						Database ID
					</Label>
					<div className="rounded-md bg-primary-50 px-3 py-2 font-mono text-primary-400 text-sm">
						#{formData.id}
					</div>
				</div>

				<div className="space-y-[6px]">
					<Label
						htmlFor="database-name"
						className="text-[13px] text-primary-400"
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

				<div className="space-y-[6px]">
					<Label
						htmlFor="database-host"
						className="text-[13px] text-primary-400"
					>
						Host
					</Label>
					<Input
						id="database-host"
						value={formData.host}
						onChange={(e) => handleInputChange("host", e.target.value)}
						placeholder="Enter host URL"
						className="w-full text-sm"
					/>
				</div>

				<div className="space-y-[6px]">
					<Label
						htmlFor="database-status"
						className="text-[13px] text-primary-300"
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

				<div className="space-y-[6px]">
					<Label
						htmlFor="last-activity"
						className="text-[13px] text-primary-400"
					>
						Last Activity
					</Label>
					<div className="rounded-md bg-primary-50 px-3 py-2 text-13px text-primary-400">
						{formData.lastActivity}
					</div>
				</div>
			</div>

			<div className="rounded-b-xl border-primary-100 border-t bg-primary-25 p-6">
				<div className="flex w-full items-center justify-between gap-3">
					<Button variant="outline" onClick={handleCancel} size="sm">
						Cancel
					</Button>

					<Button onClick={handleSave} disabled={!hasChanges} size="sm">
						Save Database
					</Button>
				</div>
			</div>
		</div>
	);
}
