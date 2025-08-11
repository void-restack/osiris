interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    schema?: any;
    skipRefresh?: boolean;
}

interface ApiResponse<T = any> {
    status: "SUCCESS" | "FAILED";
    data?: T;
    error?: string;
    message?: string;
}

class ApiError extends Error {
    constructor(
        public status: number,
        public response: any,
        message?: string,
    ) {
        super(message || `API Error: ${status}`);
        this.name = "ApiError";
    }
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

function setCookie(name: string, value: string, days?: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function ensureRefreshTokenCookie() {
    const refreshToken = localStorage.getItem("refresh_token") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzODlmYzFkOS0yMTdjLTRmZmQtYTM3Ny0wNjQ2NjlmZjZhMDkiLCJyb2xlIjoiYWRtaW4iLCJqdGkiOiIxNzU0Mzc4MTA4MzI2LTNjOTVhODQzOWU5Mjg3OWVhMmI3MjZkMjBkZjA4M2RlIiwiaWF0IjoxNzU0Mzc4MTA4LCJleHAiOjE3NTY5NzAxMDh9.yKWssVnML3v0Mo7BTnBF_C_PhMcBtnyemLC5-ubHs94"

    if (refreshToken) {
        setCookie("refresh_token", refreshToken, 30);
    }
}

async function refreshAccessToken(): Promise<string> {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;

    refreshPromise = (async () => {
        try {
            const baseUrl = (
                import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1/"
            ).replace(/\/$/, "") + "/";

            const response = await fetch(`${baseUrl}users/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Token refresh failed");
            }

            const data = await response.json();
            if (data.status === "FAILED") {
                throw new Error(data.error);
            }

            const newAccessToken = data.data.accessToken;
            localStorage.setItem("access_token", newAccessToken);

            return newAccessToken;
        } catch (error) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setCookie("refresh_token", "", -1);
            window.location.href = "/";
            throw error;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

function setRefreshTokenCookie(token: string) {
    setCookie("refresh_token", token, 30);
}

async function api<T = any>(
    endpoint: string,
    options: ApiOptions = {},
): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, params = {}, schema, skipRefresh = false } = options;
    const baseUrl =
        (
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1"
        ).replace(/\/$/, "") + "/";
    const cleanEndpoint = endpoint.replace(/^\//, "");
    const url = new URL(cleanEndpoint, baseUrl);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    });

    // Ensure refresh token is available in cookies for endpoints that need it
    // const needsRefreshToken = ['/hub/wallet/create', '/hub/wallet/add', '/logout', '/hub/wallet/'].some(path =>
    //     cleanEndpoint.includes(path)
    // );

    // if (needsRefreshToken) {
    //     ensureRefreshTokenCookie();
    // }
    ensureRefreshTokenCookie()

    const makeRequest = async (accessToken?: string): Promise<Response> => {
        const token = accessToken || localStorage.getItem("access_token")

        const requestHeaders: Record<string, string> = {
            ...headers,
        };

        if (token) {
            requestHeaders.Authorization = `Bearer ${token}`;
        }

        if (!(body instanceof FormData)) {
            requestHeaders["Content-Type"] = "application/json";
        }

        const requestInit: RequestInit = {
            method,
            headers: requestHeaders,
            mode: "cors",
            credentials: "include",
        };

        if (body && method !== "GET") {
            if (body instanceof FormData) {
                requestInit.body = body;
            } else {
                requestInit.body = JSON.stringify(body);
            }
        }

        return fetch(url.toString(), requestInit);
    };

    try {
        let response = await makeRequest();

        if (response.status === 401 && !skipRefresh) {
            try {
                const newAccessToken = await refreshAccessToken();
                response = await makeRequest(newAccessToken);
            } catch (refreshError) {
                throw new ApiError(401, null, "Authentication failed");
            }
        }

        let data: any;
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new ApiError(
                response.status,
                data,
                data?.error || `HTTP ${response.status}`,
            );
        }

        if (schema && data) {
            try {
                schema.parse(data);
            } catch (validationError) {
                console.warn("API response validation failed:", validationError);
            }
        }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        if (error instanceof TypeError && error.message.includes("fetch")) {
            throw new ApiError(0, null, "Network error - possible CORS issue");
        }
        throw new ApiError(
            0,
            null,
            error instanceof Error ? error.message : "Network error",
        );
    }
}

export { api, ApiError, setCookie, ensureRefreshTokenCookie, setRefreshTokenCookie, refreshAccessToken };
export type { ApiResponse, ApiOptions };