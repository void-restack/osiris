"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	AlertCircleIcon,
	Image,
	Lock,
	XIcon,
	Zap,
} from "lucide-react";
import { ICONS } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

const Permissions: SharePermissionCardProps[] = [
	{
		key: "private",
		title: "Keep it Private",
		description:
			"Includes up to 10 users, 20 GB individual data and access to all features.",
		Icon: <Lock className="size-3.5 stroke-primary-400" />,
	},
	{
		key: "public",
		title: "Make it Public",
		description:
			"Includes up to 10 users, 20 GB individual data and access to all features.",
		Icon: <Zap className="size-3.5 stroke-primary-400" />,
	},
];

export function CreateNewKnowledgeBase() {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [permission, setPermission] = useState("private");
	const [icon, setIcon] = useState<File | null>(null);
	const [banner, setBanner] = useState<File | null>(null);

	const mutation = useMutation({
		mutationFn: async (data: any) => {
			const formData = new FormData();
			formData.append("name", data.name);
			formData.append("description", data.description);
			formData.append("price", data.price);
			formData.append("permission", data.permission);
			if (data.icon) formData.append("icon", data.icon);
			if (data.banner) formData.append("banner", data.banner);
			const res = await fetch("/api/knowledge-base", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) throw new Error("Failed to create knowledge base");
			return res.json();
		},
	});

	const handleSave = () => {
		mutation.mutate({
			name,
			description,
			price,
			permission,
			icon,
			banner,
		});
	};

	return (
		<section className="">
			<div className="mb-10 items-center justify-between space-y-6 border border-b-primary-100 border-dashed px-8 py-[42px] md:flex md:space-y-0">
				<div>
					<h1 className="text-primary-800 text-xl">Create a new Knowledge base</h1>
					<p className="text-primary-300 text-sm">Create and upload a new knowledge base.</p>
				</div>
				<div className="flex items-center gap-3">
					<Button variant={"secondary"}>Cancel</Button>
					<Button onClick={handleSave} disabled={mutation.status === "pending"}>
						{mutation.status === "pending" ? "Saving..." : "Save Knowledge Base"}
					</Button>
				</div>
			</div>
			{/* Basic Info Form */}
			<div className="mx-auto mt-[42px] flex w-full max-w-[488px] flex-col gap-y-8">
				<div>
					<h2 className="text-base text-primary-800">Add Basic info</h2>
					<p className="text-primary-400 text-sm">Start by filling in basic details</p>
				</div>
				<div className="flex w-full flex-col gap-y-6 border-primary-100 border-b border-dashed pb-8">
					<AvatarUploader onChange={setIcon} />
					<div className="flex w-full flex-col gap-y-1.5">
						<Label required>Knowledge Base Name</Label>
						<Input
							placeholder="Bill Gates Knowledge Base"
							type="text"
							value={name}
							onChange={e => setName(e.target.value)}
						/>
					</div>
					<div className="flex w-full flex-col gap-y-1.5">
						<Label required>Description</Label>
						<Input
							placeholder="Describe your knowledge base in a one liner"
							type="text"
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</div>
					<BannerUploader onChange={setBanner} />
				</div>
			</div>
			{/* Sharing Configuration */}
			<div className="mx-auto mt-[42px] flex w-full max-w-[488px] flex-col gap-y-8">
				<div>
					<h2 className="text-base text-primary-800">Configure sharing</h2>
					<p className="text-primary-400 text-sm">Keep it to yourself or share it out with the world.</p>
				</div>
				<div className="flex w-ful flex-col gap-y-6">
					{Permissions.map((perm) => (
						<SharePermissionCard
							key={perm.key}
							title={perm.title}
							description={perm.description}
							Icon={perm.Icon}
							isSelected={permission === perm.key}
							onClick={() => setPermission(perm.key)}
						/>
					))}
				</div>
				<div className="flex w-full flex-col gap-y-1.5">
					<Label required>Set the price</Label>
					<div className="flex h-10 items-center rounded-[8px] border border-primary-100">
						<div className="flex h-full items-center justify-center border-r border-r-primary-100 bg-primary-50 px-3 text-primary-300 text-sm">
							Credits
						</div>
						<input
							type="text"
							className="h-full w-full px-3 outline-none placeholder:text-primary-300 focus:border-none focus:ring-0"
							placeholder="00"
							value={price}
							onChange={e => setPrice(e.target.value)}
						/>
						<p className="w-max shrink-0 text-primary-300 text-sm">~ $0.00</p>
					</div>
				</div>
			</div>
			{mutation.isError && (
				<div className="text-red-500 mt-4">{(mutation.error as Error)?.message}</div>
			)}
			{mutation.isSuccess && (
				<div className="text-green-600 mt-4">Knowledge base created!</div>
			)}
		</section>
	);
}

// AvatarUploader and BannerUploader now accept onChange prop
function AvatarUploader({ onChange }: { onChange: (file: File | null) => void }) {
	const [
		{ files, isDragging },
		{
			removeFile,
			openFileDialog,
			getInputProps,
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
		},
	] = useFileUpload({
		accept: "image/*",
	});

	React.useEffect(() => {
		// Only set File, not FileMetadata
		const file = files[0]?.file instanceof File ? files[0].file : null;
		onChange(file);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [files]);

	const previewUrl = files[0]?.preview || null;

	return (
		<div
			className="flex cursor-pointer items-center gap-4 "
			onClick={openFileDialog}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			data-dragging={isDragging || undefined}
			aria-label={previewUrl ? "Change image" : "Upload image"}
		>
			<div className="relative inline-flex">
				{/* Drop area */}
				<button className="relative flex size-[60px] items-center justify-center overflow-hidden rounded-[8px] border border-primary-100 border-dashed outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-disabled:pointer-events-none has-[img]:border-none has-disabled:opacity-50 data-[dragging=true]:bg-accent/50">
					{previewUrl ? (
						<img
							className="size-full object-cover"
							src={previewUrl}
							alt={files[0]?.file?.name || "Uploaded image"}
							width={64}
							height={64}
							style={{ objectFit: "cover" }}
						/>
					) : (
						<div
							className="flex size-[60px] shrink-0 items-center justify-center rounded-[8px] bg-primary-00"
							aria-hidden="true"
						>
							<Image className="size-5 stroke-primary-400" />
						</div>
					)}
				</button>
				{previewUrl && (
					<Button
						onClick={() => removeFile(files[0]?.id)}
						size="icon"
						className="-top-1 -right-1 absolute size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
						aria-label="Remove image"
					>
						<XIcon className="size-3.5" />
					</Button>
				)}
				<input
					{...getInputProps()}
					className="sr-only"
					aria-label="Upload image file"
					tabIndex={-1}
				/>
			</div>
			<div aria-live="polite" role="region" className="">
				<p className="text-primary-800 text-sm">
					Upload Knowledge Base icon <span className="text-[#F03D3D]">*</span>
				</p>
				<p className="text-primary-400 text-sm">SVG, PNG, JPG or GIF (max. 400x400px)</p>
			</div>
		</div>
	);
}

function BannerUploader({ onChange }: { onChange: (file: File | null) => void }) {
	const maxSizeMB = 5;
	const maxSize = maxSizeMB * 1024 * 1024; 

	const [
		{ files, isDragging, errors },
		{
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			openFileDialog,
			removeFile,
			getInputProps,
		},
	] = useFileUpload({
		accept: "image/*",
		maxSize,
	});

	React.useEffect(() => {
		// Only set File, not FileMetadata
		const file = files[0]?.file instanceof File ? files[0].file : null;
		onChange(file);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [files]);

	const previewUrl = files[0]?.preview || null;

	return (
		<div className="flex flex-col gap-2">
			<div className="relative">
				{/* Drop area */}
				<div
					role="button"
					onClick={openFileDialog}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					data-dragging={isDragging || undefined}
					className="relative flex min-h-[125px] flex-col items-center justify-center overflow-hidden rounded-[6px] border border-primary-100 px-5 py-4 transition-colors has-disabled:pointer-events-none has-[input:focus]:border-ring has-[img]:border-none has-disabled:opacity-50 has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
				>
					<input
						{...getInputProps()}
						className="sr-only"
						aria-label="Upload file"
					/>
					{previewUrl ? (
						<div className="absolute inset-0">
							<img
								src={previewUrl}
								alt={files[0]?.file?.name || "Uploaded image"}
								className="size-full object-cover"
							/>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center gap-y-2.5">
							<div
								className="flex size-[60px] shrink-0 items-center justify-center rounded-[8px] border border-primary-100 border-dashed bg-primary-00"
								aria-hidden="true"
							>
								<Image className="size-5 stroke-primary-400" />
							</div>
							<div className="text-center">
								<p className="mb-1.5 text-sm">Upload banner</p>
								<p className="text-primary-400 text-sm">SVG, PNG, JPG or GIF (max. 400x400px)</p>
							</div>
						</div>
					)}
				</div>
				{previewUrl && (
					<div className="absolute top-4 right-4">
						<button
							type="button"
							className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[color,box-shadow] hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							onClick={() => removeFile(files[0]?.id)}
							aria-label="Remove image"
						>
							<XIcon className="size-4" aria-hidden="true" />
						</button>
					</div>
				)}
			</div>
			{errors.length > 0 && (
				<div className="flex items-center gap-1 text-destructive text-xs" role="alert">
					<AlertCircleIcon className="size-3 shrink-0" />
					<span>{errors[0]}</span>
				</div>
			)}
		</div>
	);
}

type SharePermissionCardProps = {
	key: string;
	isSelected?: boolean;
	title: string;
	description: string;
	Icon: React.ReactNode;
	onClick?: () => void;
};

function SharePermissionCard(props: SharePermissionCardProps) {
	return (
		<div
			className={cn(
				"h-[128px] cursor-pointer rounded-[12px] ring-2 ring-[#eeefee]",
				props.isSelected && "ring-[#2DCA04]",
			)}
			onClick={props.onClick}
			tabIndex={0}
			role="button"
			aria-pressed={props.isSelected}
		>
			<div className="flex h-14 w-full items-center gap-4 border-primary-100 border-b px-3">
				{/* ICON DIV  */}
				<div
					style={{
						boxShadow: `
      0px 1px 2px 0px rgba(10, 13, 18, 0.05),
      0px -2px 0px 0px rgba(10, 13, 18, 0.05) inset,
      0px 0px 0px 1px rgba(10, 13, 18, 0.18) inset
    `,
					}}
					className="flex h-8 w-8 items-center justify-center rounded-[8px]"
				>
					{props.Icon}
				</div>
				<p className="text-base text-primary-800">{props.title}</p>
				{props.isSelected && <ICONS.bgCheck className="ml-auto size-4" />}
			</div>
			<p className="p-4 text-primary-400 text-sm drop-shadow-sm">{props.description}</p>
		</div>
	);
}
