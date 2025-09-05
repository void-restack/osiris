import { ScrollArea } from '@/components/ui/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import { WorkflowStepsContainer } from '@/components/features/workflow/workflow-steps-container'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export const Route = createFileRoute('/_hub/workflow/$workflowId')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className='p-8 w-full flex flex-col'>
            <ScrollArea className='w-full h-20 rounded-lg bg-primary-50 hidebar text-pretty p-2 mb-14'>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Est eveniet eligendi enim quae consequatur minus, nulla, quibusdam commodi, aliquam adipisci illo. Cumque, tempora laboriosam labore excepturi repudiandae cupiditate placeat ipsa.
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse iusto laborum ea voluptatem dolorem, natus deserunt totam omnis quas mollitia sint magnam, voluptates rem itaque labore vel dignissimos quos saepe.
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam veniam tempora debitis, harum, magni nulla, aut quaerat alias magnam assumenda atque quas odit eligendi officiis distinctio maiores a officia dolorum?
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis repudiandae error nihil obcaecati, veniam earum voluptatem recusandae officiis corporis. Perferendis, est neque molestiae eum labore cumque laborum ipsum sunt corrupti.
            </ScrollArea>

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
