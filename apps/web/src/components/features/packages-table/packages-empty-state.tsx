export function PackagesEmptyState() {

    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center">
                <img src="/noresults.svg" alt="Packages" className="size-48" />

                <h3 className="font-medium text-primary-400 mb-2">
                    No Packages Found
                </h3>
                <p className="text-sm text-pretty text-primary-300 mb-6 max-w-sm">
                    No packages are available at the moment.
                </p>
            </div>
        </div>
    );
}
