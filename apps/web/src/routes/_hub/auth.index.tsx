import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Link2, RefreshCcw } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type Permission,
	PermissionSelector,
} from "@/components/ui/permission-selector";

const samplePermissions: Permission[] = [
	{ id: "read-emails", label: "Read Emails" },
	{ id: "write-emails", label: "Write Emails" },
	{ id: "reply-emails", label: "Reply to Emails" },
	{ id: "send-emails", label: "Send Emails" },
	{ id: "add-recipients", label: "Add recipients" },
	{ id: "delete-emails", label: "Delete Emails" },
	{ id: "manage-folders", label: "Manage Folders" },
	{ id: "access-calendar", label: "Access Calendar" },
];

export const Route = createFileRoute("/_hub/auth/")({
	component: RouteComponent,
	loader: () => ({
		breadcrumb: "Authentication",
	}),
});

function RouteComponent() {
	const countries = [
		{ value: "us", label: "United States" },
		{ value: "ca", label: "Canada" },
		{ value: "uk", label: "United Kingdom" },
		{ value: "de", label: "Germany" },
		{ value: "fr", label: "France" },
	];

	const searchCountries = (query: string) => {
		return countries.filter((country) =>
			country.label.toLowerCase().includes(query.toLowerCase()),
		);
	};

	return (
		<div>
			<div className="flex flex-1 flex-col pt-4">
				<div className="mx-auto mt-8 max-w-[496px] pb-14 text-center md:w-[496px]">
					<h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
						Search all authenticators
					</h2>
					<span className="text-primary-300 text-sm">
						Search across various of authentication hubs on osiris
					</span>
				</div>
				<div className="w-full px-4 md:px-0">
					<Autocomplete
						className="mt-6"
						onSearch={searchCountries}
						emptyText="No countries found."
						footerText="Footer text"
						bottomLeftContent={
							<div className="flex items-center gap-3">
								<div className="rounded-md bg-primary-50 p-1.5 text-xs">
									Google
								</div>
								<div className="rounded-md bg-primary-50 p-1.5 text-xs">
									Github
								</div>
							</div>
						}
						bottomRightContent={<></>}
						popularItems={
							<div className="flex w-full gap-2">
								<div className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
									Github
								</div>
								<div className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
									Google
								</div>
							</div>
						}
					/>
				</div>
				<div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4 font-medium text-xl">
					<h4>All Hubs</h4>
				</div>
				<div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
					<Link
						to={`/auth/${123}`}
						className="h-fit min-h-48 min-w-xs rounded-xl border border-primary-100 p-6"
					>
						<div className="mb-4 flex w-full items-start justify-between">
							<div className="size-14 rounded-xl bg-purple-400" />
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										className="flex h-fit items-center gap-1 rounded-[6px] bg-badge-success px-2 py-1 font-medium text-badge-success-text text-xs"
									>
										<Link2 /> Connect
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100 p-0">
									<AlertDialogHeader className="border-b border-b-primary-100 px-4 py-3">
										<AlertDialogTitle className="font-normal text-base text-primary-400">
											Connect Gmail
										</AlertDialogTitle>
									</AlertDialogHeader>
									<div className="w-full">
										<div className="flex flex-col space-y-6">
											<div className="flex items-center justify-between px-4">
												<div className="flex">
													<div className="size-10 rounded-lg bg-purple-400" />
													<div className="-ml-3 size-10 rounded-lg bg-green-400" />
													<div className="ml-2 flex flex-col">
														<span className="text-primary-800 text-sm">
															Piyush Jain
														</span>
														<span className="text-primary-300 text-xs">
															piyushj03z@gmail.com
														</span>
													</div>
												</div>
												<div className="rounded-md border border-primary-300 p-1">
													<RefreshCcw className="size-4 text-primary-300" />
												</div>
											</div>

											<div className="flex flex-col space-y-1.5 px-4 text-[13px] text-primary-400">
												<label htmlFor="auth_hub_name">Auth Hub Name</label>
												<Input type="text" placeholder="Work email 1" />
											</div>

											<div className="border-t border-t-primary-200 border-dashed" />

											<div className="flex flex-col px-4">
												<div className="mb-4 flex flex-col">
													<span>Allow Access</span>
													<span className="text-[13px] text-primary-300">
														Configure the data access for the MCPs
													</span>
												</div>

												<PermissionSelector
													permissions={samplePermissions}
													placeholder="Search permissions..."
												/>
											</div>
										</div>
									</div>
									<AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-between">
										<AlertDialogCancel className="bg-primary-50">
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction className="inset-shadow-search-btn">
											Save Authenticator
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
						<div className="justify-baseline mb-4 flex flex-col items-start">
							<h4 className="inline items-center font-medium">
								Contacts <BadgeCheck className="inline size-4" />
							</h4>
							<span className="text-primary-300 text-xs tracking-tight">
								25+ Scopes
							</span>
						</div>
						<p className="text-ellipsis text-primary-300 text-sm">
							Store and retrieve user-specific memories to maintain context and
							make informed decisions based on past interactions
						</p>
					</Link>
				</div>
			</div>

			{/* could have shifted it in the route layout but we need different data for different routes here so need to keep it here with an extra div */}
			<div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-purple-200 p-6">
				Bottom Bar
			</div>
		</div>
	);
}
