import { ScrollArea } from '@/components/ui/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import { WorkflowStepsContainer } from '@/components/features/workflow/workflow-steps-container'
import { Button } from '@/components/ui/button'
import { Play, Edit } from 'lucide-react'
import { useAppStore } from '@/lib/store'

// Mock workflow data - replace with actual API call
const mockWorkflowData = {
    id: "f09eb4c4-664d-4eb6-b270-2003b536c580",
    title: "Tasks and deadlines",
    description: "I want you to find me the best hotels in 3 miles area I want you to find me the best hotels in 3 miles areal want you to find me the best hotels in 3 miles areal want you to find me the best hotels in 3 miles areal want you to find me the best hotels in 3 miles area",
    imageUrl: "https://xyz.com",
    coverImageUrl: "https://xyz.com",
    workflow: [
        {
            name: "Gmail",
            prompt: "read my my today's email and share a summary to s@fetcch.xyz",
            deploymentId: ["c275db6a-1ba2-4d91-b6ee-f187fe471ac9"],
            knowledgeBaseIds: []
        }
    ],
    isPublic: true,
    agentId: null,
    knowledgeBaseId: null,
    serviceClient: null,
    embedding: null,
    timeBasedTrigger: {
        rrule: "RRULE:FREQ=MINUTELY;COUNT=60",
        startTime: "2025-09-04T19:51:33.201Z"
    },
    nextExecution: null,
    ownerId: "40f084bd-45b7-46b8-8ef9-53187a9122c3",
    createdAt: "2025-09-05T12:19:05.860Z",
    updatedAt: "2025-09-05T12:19:05.860Z"
}

export const Route = createFileRoute('/_hub/workflow/$workflowId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { openWorkflowEditSidebar } = useAppStore()

    const handleEditWorkflow = () => {
        openWorkflowEditSidebar(mockWorkflowData)
    }

    return (
        <div className='p-8 w-full flex flex-col'>
            <div className='relative'>
                <ScrollArea className='w-full h-20 rounded-lg bg-primary-50 hidebar text-pretty p-2 mb-14'>
                    {mockWorkflowData.description}
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
                    <p className='text-primary-300'>Last run: 2 hrs ago</p>
                </div>

                <div className='space-y-6'>
                    <WorkflowStepsContainer />

                    {/* Start Button */}
                    <div className='pt-4'>
                        <Button className='w-full bg-primary-800 hover:bg-primary-900 text-white'>
                            <Play size={16} className='mr-2' />
                            Start now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
