import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";

export function useRouteChangeListener() {
    const router = useRouter();
    const {
        closeEditSidebar,
        closeMcpServerEditSidebar,
        closeOAuthClientEditSidebar,
        closeWorkflowEditSidebar,
        closeWorkflowExecutionSidebar,
    } = useAppStore();

    useEffect(() => {
        const unsubscribe = router.subscribe("onLoad", () => {
            closeEditSidebar();
            closeMcpServerEditSidebar();
            closeOAuthClientEditSidebar();
            closeWorkflowEditSidebar();
            closeWorkflowExecutionSidebar();
        });

        return unsubscribe;
    }, [
        router,
        closeEditSidebar,
        closeMcpServerEditSidebar,
        closeOAuthClientEditSidebar,
        closeWorkflowEditSidebar,
        closeWorkflowExecutionSidebar,
    ]);
}
