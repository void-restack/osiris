import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, CheckIcon } from "lucide-react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/hub/auth")({
	component: RouteComponent,
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
					/>
				</div>
				<div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4 font-medium text-xl">
					<h4>All Hubs</h4>
				</div>
				<div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="h-fit min-h-48 min-w-xs rounded-xl border border-primary-100 p-6">
						<div className="mb-4 flex w-full items-start justify-between">
							<div className="size-14 rounded-xl bg-purple-400" />
							{/* connection status btn TODO: make status badge variants */}
							<Badge variant="outline" className="h-6 gap-1 rounded-md">
								<CheckIcon
									className="text-emerald-500"
									size={12}
									aria-hidden="true"
								/>
								Badge
							</Badge>
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
					</div>
				</div>
			</div>

			{/* could have shifted it in the route layout but we need different data for different routes here so need to keep it here with an extra div */}
			<div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-purple-200 p-6">
				Bottom Bar
			</div>
		</div>
	);
}
