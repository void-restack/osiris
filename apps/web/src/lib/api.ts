import { up } from "up-fetch";

export const api = up(fetch, () => ({
	baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1",
	headers: {
		"Content-Type": "application/json",
		Authorization: `Bearer ${localStorage.getItem("access_token")}`,
	},
	timeout: 30000,
	onError: (error: any) => {
		if (error.status === 401) {
			localStorage.removeItem("access_token");
			window.location.href = "/";
		}
	},
}));
