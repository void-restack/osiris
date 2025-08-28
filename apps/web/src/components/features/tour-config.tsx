import type { StepType } from '@reactour/tour';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export const tourSteps: StepType[] = [
    {
        selector: '[data-tour="onboarding-steps"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Welcome to Osiris!</h3>
                <p className="mb-4 text-gray-600 leading-relaxed">Let's take a quick tour to show you around the platform and get you started with building powerful AI agents.</p>
            </div>
        ),
        position: 'bottom',
    },
    {
        selector: '[data-tour="sidebar"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Main Navigation Sidebar</h3>
                <p className="text-gray-600 leading-relaxed">Use this menu to access every power feature on Osiris: browse MCPs, manage Authentications, Manage and add knowledge bases</p>
            </div>
        ),
        position: 'right',
    },

    {
        selector: '[data-tour="mcp-hub"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">MCP Hub Entry Point</h3>
                <p className="text-gray-600 leading-relaxed">Browse and install Model Context Protocol packages here. MCPs provide AI with superpowers integrate trading, productivity, crypto, and more.</p>
            </div>
        ),
        position: 'right',
    },
    {
        selector: '[data-tour="trending-mcps"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Trending MCP Packages Section</h3>
                <p className="text-gray-600 leading-relaxed">Discover what's popular and new. Click any MCP card for detailed docs, sample code, and oneclick install.</p>
            </div>
        ),
        position: 'top',
    },
    {
        selector: '[data-tour="auth-hub"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Authentication Hub</h3>
                <p className="text-gray-600 leading-relaxed">Authentication connects your Osiris account with trusted platforms like GitHub, Google, Discord, and Notion. so your AI agents and MCPs can securely access and automate tasks across these services</p>
            </div>
        ),
        position: 'right',
    },
    {
        selector: '[data-tour="knowledge-base"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Knowledge Base Hub</h3>
                <p className="text-gray-600 leading-relaxed">Upload, manage, and discover AI knowledge bases. Power your MCPs and Agents with curated, uptodate data for smarter results.</p>
            </div>
        ),
        position: 'right',
    },
    {
        selector: '[data-tour="profile"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Profile & Credits</h3>
                <p className="text-gray-600 leading-relaxed">Check your credit balance, view your deployments, and manage your connected accounts here. Essential for seeing usage and billing status.</p>
            </div>
        ),
        position: 'right',
    },
    {
        selector: '[data-tour="docs-support"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Docs/Support</h3>
                <p className="text-gray-600 leading-relaxed">Have questions? Access indepth docs and live support anytime from here. Don't hesitate to get expert help!</p>
            </div>
        ),
        position: 'right',
    },
    {
        selector: '[data-tour="first-mcp"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">First MCP Action</h3>
                <p className="text-gray-600 leading-relaxed">Ready to try your first MCP? Click here to open its documentation and start connecting your apps no code required! Chat, coming soon!</p>
            </div>
        ),
        position: 'top',
    },
    {
        selector: '[data-tour="end-tour"]',
        content: (
            <div className="p-6 bg-white rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">You're All Set!</h3>
                <p className="text-gray-600 leading-relaxed">Explore Osiris, connect your protocols, and let your AI agents work for you. Need help? Docs and support are a click away. Happy building!</p>
            </div>
        ),
        position: 'center',
    },
];

export const tourConfig = {
    steps: tourSteps,
    styles: {
        popover: (base: any) => ({
            ...base,
            '--reactour-accent': 'hsl(var(--primary))',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            border: '1px solid hsl(var(--border))',
            padding: '0px 10px 10px 10px',
            minWidth: '320px',
            maxWidth: '400px',
            // Ensure tour step is clearly visible against blurred background
            backgroundColor: 'white',
            zIndex: 9999,
        }),
        maskArea: (base: any) => ({
            ...base,
            rx: 8,
            // Add blur effect to the overlay
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            // Ensure the mask covers the entire viewport
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        }),
        step: (base: any) => ({
            ...base,
            // Ensure the highlighted element is clearly visible
            outline: '2px solid hsl(var(--primary))',
            outlineOffset: '2px',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
        }),
        navigation: (base: any) => ({
            ...base,
            gap: '4px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
        }),
        stepIndicator: (base: any, { currentStep, stepIndex }: any) => ({
            ...base,
            border: '1px solid #FF0000',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
        })
    },

    showBadge: false,
    showCloseButton: true,
    showNavigation: true,
    showActions: false,
    showStepIndicator: true,
    disableInteraction: true,
    // Prevent tour from closing when clicking outside
    disableDotsNavigation: false,
    // Ensure tour step is always visible
    inViewThreshold: 0,
    prevButton: ({ currentStep, setCurrentStep }: any) => {
        if (currentStep === 0) return null; // Hide prev button on first step
        return (
            <Button
                onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))}
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
                ←
            </Button>
        );
    },
    nextButton: ({ currentStep, stepsLength, setCurrentStep, setIsOpen }: any) => (
        <Button
            onClick={() => {
                if (currentStep === stepsLength - 1) {
                    setIsOpen(false);
                } else {
                    setCurrentStep(currentStep + 1);
                }
            }}
            variant="outline"
            size="sm"
            className={cn(" p-0  border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50", currentStep === stepsLength - 1 ? "w-fit rounded-md px-2" : "h-10 w-10 rounded-full")}
        >
            {currentStep === stepsLength - 1 ? 'End Tour' : '→'}
        </Button>
    ),
    // actions: ({ setIsOpen }: any) => (
    //     <Button
    //         onClick={() => setIsOpen(false)}
    //         variant="outline"
    //         size="sm"
    //         className="h-10 px-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600 hover:text-gray-800"
    //     >
    //         Skip Tour
    //     </Button>
    // ),
};