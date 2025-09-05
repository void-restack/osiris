import WorkflowGrid from '@/components/features/workflow/workflow-grid'
import { Autocomplete } from '@/components/ui/autocomplete'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_hub/workflow/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div>
            <div className="flex flex-1 flex-col pt-4">
                {/* Header */}
                <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
                    <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
                        Add a Task or Workflow Description
                    </h2>
                    <span className="text-primary-300 text-sm">
                        Add context for your task or flow. Use @ to reference MCPs or agents.
                    </span>
                </div>
                {/* Search Autocomplete */}
                <div className="px-4 mb-14 w-full mx-auto">
                    <Autocomplete
                        onSearch={() => []}
                        className="mt-6"
                        placeholder='Describe what you want to do…'
                        // onSearch={searchAuthMethods}
                        // getItemValue={(item) => item.clientId}
                        // getItemLabel={(item) => item.name}
                        // emptyText={isSearching ? "Searching..." : "No auth methods found."}
                        footerText="Footer text"
                        bottomRightContent={<></>}
                    />
                </div>

                <div className="px-4 md:px-6 mb-24 sm:mb-28">
                    <div className="w-full max-w-full">
                        <WorkflowGrid />
                    </div>
                </div>

                {/* Bottom pagination */}
                <div className="sticky rounded-b-xl bottom-0 border-t border-t-primary-100 flex w-full items-center overflow-hidden bg-primary-00 px-4 sm:px-6 py-2 sm:py-3 z-40">
                    Workflow Footer
                </div>
            </div>
        </div>
    )
}
