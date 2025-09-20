export function OAuthClientEmptyState() {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="w-full mx-auto flex flex-col items-center justify-center text-center">
                <img src="/noresults.svg" alt="OAuth Client" className="size-48" />

                <h3 className="font-medium text-primary-400 mb-2">
                    No Results to show
                </h3>
                <p className="text-sm text-pretty text-primary-300 mb-6 max-w-sm">
                    Get started by creating your first OAuth client to enable authentication for your applications.
                </p>
            </div>
        </div>
    );
}