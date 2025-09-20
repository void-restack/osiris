import WorkflowGrid from '@/components/features/workflow/workflow-grid'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_hub/workflow/')({
    component: RouteComponent,
})

function RouteComponent() {
    return <WorkflowGrid />
}
