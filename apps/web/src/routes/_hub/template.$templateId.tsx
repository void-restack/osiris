import { ScrollArea } from '@/components/ui/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Loader2, Copy } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { chatQueries } from '@/lib/queries'
import WorkflowStepsContainer from '@/components/features/workflow/workflow-steps-container'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_hub/template/$templateId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { templateId } = Route.useParams()
    const { user, isLoading: userLoading } = useAuth()

    const { data: template, isLoading: templateLoading, error } = useQuery(
        chatQueries.templateWorkflowOptions(templateId)
    )

    const handleCloneTemplate = () => {
        // TODO: Implement clone template functionality
        console.log('Clone template functionality will be implemented later')
    }

    if (templateLoading || userLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-primary-600">Loading...</span>
            </div>
        )
    }

    if (error || !template) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-600">Failed to load template. Please try again.</p>
            </div>
        )
    }

    // Check if current user is the owner
    const isOwner = user?.id === template.ownerId


    return (
        <div className='px-8 pt-8 w-full flex flex-col'>
            <div className='relative'>
                <ScrollArea className='w-full h-20 rounded-lg bg-primary-50 hidebar text-pretty p-2 mb-14'>
                    {template.description}
                </ScrollArea>
            </div>

            <div className='flex w-full flex-col'>
                <div className='flex flex-col items-start gap-2 mb-8'>
                    <h2 className='text-primary-800 text-xl'>{template.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-primary-300">
                        <span>Template by {template.ownerId}</span>
                        {template.isPublic && (
                            <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs">
                                Public Template
                            </span>
                        )}
                        {!template.isPublic && (
                            <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-full text-xs">
                                Private Template
                            </span>
                        )}
                    </div>
                </div>

                <div className='w-full'>
                    <WorkflowStepsContainer
                        workflowData={template}
                        isTemplate={true}
                        isOwner={isOwner}
                    />
                    <div className='pt-4 w-full'>
                        <Button
                            onClick={handleCloneTemplate}
                            className='w-full bg-primary-800 hover:bg-primary-900 text-white'
                        >
                            <Copy size={16} className='mr-2' />
                            Clone Template
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    )
}
