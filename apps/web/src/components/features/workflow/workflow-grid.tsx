import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";

export default function WorkflowGrid() {
    return (
        <div className="space-y-4">
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                        Workflows
                    </span>
                </div>
                <div className="flex w-full items-start md:items-center justify-end gap-3">
                    hell
                </div>
            </div>
            <WorkflowGridView />
        </div>
    )
}

interface IWorkflow {
    title: string;
    workflowId: string;
    description: string;
    iconUrl: string;
    link: string;
}

// lets create dummy workflows data
const workflows: IWorkflow[] = [
    {
        title: "Workflow 1",
        workflowId: "1",
        description: "Description 1",
        iconUrl: "https://via.placeholder.com/150",
        link: "https://www.google.com"
    },
    {
        title: "Workflow 2",
        workflowId: "2",
        description: "Description 2",
        iconUrl: "https://via.placeholder.com/150",
        link: "https://www.google.com"
    }
]

export function WorkflowGridView() {
    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 pb-24 sm:pb-28 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {workflows.map((workflow: IWorkflow) => (
                    <div
                        key={workflow.workflowId}
                        className="relative group h-fit min-h-52 rounded-xl border border-primary-100 p-6  hover:border-primary-200 block cursor-pointer hover:bg-[#FAFAFA]"
                        style={{ zIndex: 1 }}
                        aria-label={`Go to ${workflow.title}`}
                        tabIndex={0}
                        role="link"
                        onClick={e => {
                            if (e.defaultPrevented) return;
                            // @ts-ignore
                            if (e.target.closest('.auth-method-dialog-trigger')) return;
                        }}
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                                // @ts-ignore
                                if (e.target.closest('.auth-method-dialog-trigger')) return;
                            }
                        }}
                    >
                        <Link
                            to={`/workflow/${workflow.workflowId}`}
                            className="absolute inset-0 z-10"
                            aria-label={`Go to ${workflow.title}`}
                            tabIndex={-1}
                            style={{ pointerEvents: "auto" }}
                        />
                        {/* Card Content */}
                        <div className="relative z-20 pointer-events-none">
                            {/* Header */}
                            <div className="mb-4 flex w-full items-start justify-between">
                                <div className="flex flex-col items-start gap-3">
                                    <Avatar className="size-12 rounded-[6px]">
                                        <AvatarImage
                                            src={workflow.iconUrl ?? undefined}
                                            alt={workflow.title}
                                            className="rounded-[6px] bg-transparent"
                                        />
                                        <AvatarFallback className="rounded-[6px]">
                                            {workflow.title.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <h4 className="font-medium text-primary-800 capitalize flex items-center gap-1">
                                            {workflow.title}
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-3">
                                <p className="text-primary-300 text-sm line-clamp-2 leading-relaxed">
                                    {workflow.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}