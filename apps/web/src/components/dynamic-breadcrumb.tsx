import { Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function DynamicBreadcrumb() {
	const breadcrumbs = useBreadcrumbs();

	// if (breadcrumbs.length < 2) return null

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs.map((crumb, _index) => (
					<div key={crumb.path} className="flex items-center gap-2">
						<BreadcrumbItem>
							{crumb.isLast ? (
								<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link to={crumb.path}>{crumb.label}</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{!crumb.isLast && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
