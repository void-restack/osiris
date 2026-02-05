import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userQueries } from "@/lib/queries";
import { useUpdateUserMutation } from "@/lib/mutations";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function UsernameValidationDialog() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user, isLoading } = useQuery({
    ...userQueries.meOptions(true),
  });

  const updateUserMutation = useUpdateUserMutation();

  // Show dialog if user exists but doesn't have a username
  const shouldShowDialog = user && !user.username && !isLoading;

  const validateUsername = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return "Username is required";
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 30) {
      return "Username must be less than 30 characters";
    }
    // Allow alphanumeric, underscores, and hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Username can only contain letters, numbers, underscores, and hyphens";
    }
    // Must start with a letter or number
    if (!/^[a-zA-Z0-9]/.test(value)) {
      return "Username must start with a letter or number";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserMutation.mutateAsync({ username: username.trim() });
      toast.success("Username updated successfully");
      setUsername("");
    } catch (err: any) {
      setError(err?.message || "Failed to update username. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldShowDialog) {
    return null;
  }

  return (
    <AlertDialog open={true} onOpenChange={() => {}}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Username Required</AlertDialogTitle>
          <AlertDialogDescription>
            Please set a username for your account to continue. This will be used in your profile URL and package URLs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter your username"
                disabled={isSubmitting}
                className={error ? "border-red-500" : ""}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Username must be 3-30 characters, contain only letters, numbers, underscores, and hyphens, and start with a letter or number.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !username.trim()}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Saving..." : "Save Username"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
