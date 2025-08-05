import { LogIn } from "lucide-react";
import { Button } from "./ui/button";

export function LoginButton() {
    const handleLogin = () => {
        window.location.href = "/";
    };

    return (
        <Button
            onClick={handleLogin}
            className="flex h-12 cursor-pointer items-center justify-start rounded-[8px] border border-primary-100 border-dashed bg-white text-foreground hover:bg-gray-50 hover:text-foreground"
            variant="default"
        >
            <div className="flex items-center gap-3">
                <div className="bg-primary-800 size-8 rounded-sm flex items-center justify-center">
                    <LogIn className="text-white size-4" />
                </div>
                <div className="text-left">
                    <h3 className="text-[#171717] font-medium">Sign In</h3>
                    <p className="text-[#A3A3A3] text-xs">Access your account</p>
                </div>
            </div>
        </Button>
    );
}