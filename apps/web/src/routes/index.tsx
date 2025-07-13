import { createFileRoute } from "@tanstack/react-router";
import HubLayout from "@/components/layouts/hub-layout";
export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return <HubLayout>Home Page</HubLayout>;
}
