import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "./api";

const handleQueryError = (error: unknown) => {
	if (error instanceof ApiError) {
		switch (error.status) {
			case 401:
				break;
			case 402:
				break;
			case 403:
				toast.error("You don't have permission to access this resource");
				break;
			case 404:
				toast.error("Resource not found");
				break;
			case 429:
				toast.error("Too many requests. Please try again later.");
				break;
			case 500:
				toast.error("Server error. Please try again.");
				break;
			default:
				toast.error(error.response?.error || "An unexpected error occurred");
		}
	} else {
		console.error("Query error:", error);
		toast.error("Network error. Please check your connection.");
	}
};

const handleMutationError = (error: unknown) => {
	if (error instanceof ApiError) {
		if (error.status === 402) {
			return;
		}

		switch (error.status) {
			case 400:
				toast.error(error.response?.error || "Invalid request");
				break;
			case 409:
				toast.error("Resource already exists or conflict occurred");
				break;
			default:
				handleQueryError(error);
		}
	} else {
		handleQueryError(error);
	}
};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: (failureCount, error) => {
				if (
					error instanceof ApiError &&
					error.status >= 400 &&
					error.status < 500
				) {
					return false;
				}
				return failureCount < 3;
			},
			refetchOnWindowFocus: false,
		},
		mutations: {
			retry: (failureCount, error) => {
				if (
					error instanceof ApiError &&
					error.status >= 400 &&
					error.status < 500
				) {
					return false;
				}
				return failureCount < 1;
			},
		},
	},
	queryCache: new QueryCache({
		onError: handleQueryError,
	}),
	mutationCache: new MutationCache({
		onError: handleMutationError,
	}),
});







export const handlePaymentError = (
	error: unknown,
	onPaymentRequired?: (details: any) => void,
) => {
	if (error instanceof ApiError && error.status === 402) {
		const paymentDetails = error.response?.paymentRequired;
		if (paymentDetails && onPaymentRequired) {
			onPaymentRequired(paymentDetails);
		} else {
			toast.error(
				`Insufficient credits. Required: $${paymentDetails?.amount || "unknown"}`,
			);
		}
		return true;
	}
	return false;
};
