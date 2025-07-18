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

export const clearAuthData = () => {
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
	queryClient.clear();
};

export const setAuthData = (accessToken: string, refreshToken: string) => {
	localStorage.setItem("access_token", accessToken);
	localStorage.setItem("refresh_token", refreshToken);
};

export const setupTokenRefresh = () => {
	let isRefreshing = false;
	let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

	const processQueue = (error: any, token: string | null = null) => {
		failedQueue.forEach(({ resolve, reject }) => {
			if (error) {
				reject(error);
			} else {
				resolve(token);
			}
		});

		failedQueue = [];
	};

	const originalFetch = window.fetch;
	window.fetch = async (...args) => {
		const response = await originalFetch(...args);

		if (response.status === 401) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(() => {
					const [url, options] = args;
					const newOptions = {
						...options,
						headers: {
							...options?.headers,
							Authorization: `Bearer ${localStorage.getItem("access_token")}`,
						},
					};
					return originalFetch(url, newOptions);
				});
			}

			isRefreshing = true;

			try {
				const refreshToken = localStorage.getItem("refresh_token");
				if (!refreshToken) {
					throw new Error("No refresh token available");
				}

				const refreshResponse = await originalFetch("/v1/users/auth/refresh", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				});

				if (!refreshResponse.ok) {
					throw new Error("Token refresh failed");
				}

				const data = await refreshResponse.json();
				if (data.status === "FAILED") {
					throw new Error(data.error);
				}

				const newAccessToken = data.data.accessToken;
				localStorage.setItem("access_token", newAccessToken);

				processQueue(null, newAccessToken);
				isRefreshing = false;

				const [url, options] = args;
				const newOptions = {
					...options,
					headers: {
						...options?.headers,
						Authorization: `Bearer ${newAccessToken}`,
					},
				};
				return originalFetch(url, newOptions);
			} catch (error) {
				processQueue(error, null);
				isRefreshing = false;

				clearAuthData();
				window.location.href = "/login";

				throw error;
			}
		}

		return response;
	};
};

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
