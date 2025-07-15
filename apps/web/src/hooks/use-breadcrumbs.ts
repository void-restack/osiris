import { useLocation, useMatches } from "@tanstack/react-router";

export interface BreadcrumbItem {
	label: string;
	path: string;
	isLast: boolean;
}

const BREADCRUMB_MAPPINGS: Record<string, string> = {
	hub: "Hub",
	auth: "AuthHub",
	mcp: "MCPs",
	knowledge: "Knowledge",
};

export function useBreadcrumbs(): BreadcrumbItem[] {
	const matches = useMatches();
	const location = useLocation();

	const pathname = location.pathname;

	const pathSegments = pathname.split("/").filter(Boolean);

	const breadcrumbItems: BreadcrumbItem[] = [];

	let currentPath = "";

	for (let i = 0; i < pathSegments.length; i++) {
		const segment = pathSegments[i];
		currentPath += `/${segment}`;

		if (BREADCRUMB_MAPPINGS[segment]) {
			breadcrumbItems.push({
				label: BREADCRUMB_MAPPINGS[segment],
				path: currentPath,
				isLast: false,
			});
		} else if (i > 0) {
			const match = matches.find((m) => m.pathname === currentPath);
			if (match?.loaderData?.breadcrumb) {
				breadcrumbItems.push({
					label: match.loaderData.breadcrumb,
					path: currentPath,
					isLast: false,
				});
			}
		}
	}

	if (breadcrumbItems.length > 0) {
		breadcrumbItems[breadcrumbItems.length - 1].isLast = true;
	}

	return breadcrumbItems;
}
