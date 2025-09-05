import { ScrollArea } from '@/components/ui/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import { WorkflowStepsContainer } from '@/components/features/workflow/workflow-steps-container'
import { Button } from '@/components/ui/button'
import { Play, Edit, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useQuery } from '@tanstack/react-query'
import { chatQueries } from '@/lib/queries'
import { useExecuteWorkflowMutation } from '@/lib/mutations'


export const Route = createFileRoute('/_hub/workflow/$workflowId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { workflowId } = Route.useParams()
    const { openWorkflowEditSidebar } = useAppStore()
    const executeWorkflowMutation = useExecuteWorkflowMutation()

    const { data: workflow, isLoading, error } = useQuery(
        chatQueries.workflowOptions(workflowId)
    )

    const handleEditWorkflow = () => {
        if (workflow) {
            openWorkflowEditSidebar(workflow)
        }
    }

    const handleExecuteWorkflow = async () => {
        if (workflow) {
            executeWorkflowMutation.mutate({ workflowId: workflow.id })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-primary-600">Loading workflow...</span>
            </div>
        )
    }

    if (error || !workflow) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-600">Failed to load workflow. Please try again.</p>
            </div>
        )
    }

    return (
        <div className='p-8 w-full flex flex-col'>
            <div className='relative'>
                <ScrollArea className='w-full h-20 rounded-lg bg-primary-50 hidebar text-pretty p-2 mb-14'>
                    {workflow.description}
                </ScrollArea>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditWorkflow}
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </div>

            <div className='flex w-full flex-col'>
                <div className='flex flex-col items-start gap-2 mb-8'>
                    <h2 className='text-primary-800 text-xl'>Workflow Steps</h2>
                    <div className="flex items-center gap-4 text-sm text-primary-300">
                        <span>Last run: 2 hrs ago</span>
                        {workflow.isPublic && (
                            <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs">
                                Public
                            </span>
                        )}
                    </div>
                </div>

                <div className='space-y-6'>
                    <WorkflowStepsContainer workflowData={workflow} />

                    {/* Start Button */}
                    <div className='pt-4'>
                        <Button
                            onClick={handleExecuteWorkflow}
                            disabled={executeWorkflowMutation.isPending}
                            className='w-full bg-primary-800 hover:bg-primary-900 text-white'
                        >
                            {executeWorkflowMutation.isPending ? (
                                <>
                                    <Loader2 size={16} className='mr-2 animate-spin' />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play size={16} className='mr-2' />
                                    Start now
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
