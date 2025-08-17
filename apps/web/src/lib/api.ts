interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  schema?: any;
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

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1"}/users/auth/refresh`,
      {
        method: "POST",
        credentials: "include", // Include cookies for refresh token
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === "SUCCESS") {
        return true; // Token refreshed successfully
      }
    }

    // Check if refresh token is missing
    if (response.status === 400 || response.status === 401) {
      const errorData = await response.json();
      if (
        errorData.message?.includes("refresh token is missing") ||
        errorData.error?.includes("refresh token is missing")
      ) {
        // User is not logged in, redirect to login
        window.location.href = "/login";
        return false;
      }
    }

    return false; // Refresh failed
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

async function api<T = any>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, params = {}, schema } = options;
  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1").replace(
      /\/$/,
      "",
    ) + "/";
  const cleanEndpoint = endpoint.replace(/^\//, "");
  const url = new URL(cleanEndpoint, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

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

  const makeRequest = async (): Promise<any> => {
    const response = await fetch(url.toString(), requestInit);
    let data: any;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.status === 401) {
      throw new ApiError(401, data, "Unauthorized");
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
  };

  try {
    return await makeRequest();
  } catch (error) {
    // Check if it's an authentication error
    if (
      error instanceof ApiError &&
      (error.status === 401 ||
        error.message?.toLowerCase().includes("unauthorized") ||
        error.response?.message?.toLowerCase().includes("unauthorized"))
    ) {
      // Skip refresh for auth-related endpoints to prevent infinite loops
      if (
        endpoint.includes("/auth/refresh") ||
        endpoint.includes("/auth/revoke")
      ) {
        throw error;
      }

      // Try to refresh token if not already refreshing
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      try {
        const refreshSuccess = await refreshPromise;
        if (refreshSuccess) {
          // Token refreshed, retry the original request
          isRefreshing = false;
          refreshPromise = null;
          return await makeRequest();
        } else {
          // Refresh failed, user needs to login
          isRefreshing = false;
          refreshPromise = null;
          throw new ApiError(401, null, "Authentication required");
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshPromise = null;
        throw error; // Throw the original error
      }
    }

    // Handle other errors
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

export { api, ApiError };
export type { ApiResponse, ApiOptions };

//
// interface ApiOptions {
//   method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
//   body?: any;
//   headers?: Record<string, string>;
//   params?: Record<string, string>;
//   schema?: any;
// }
//
// interface ApiResponse<T = any> {
//   status: "SUCCESS" | "FAILED";
//   data?: T;
//   pagination?: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
//   error?: string;
//   message?: string;
// }
//
// class ApiError extends Error {
//   constructor(
//     public status: number,
//     public response: any,
//     message?: string,
//   ) {
//     super(message || `API Error: ${status}`);
//     this.name = "ApiError";
//   }
// }
//
// // Utility function to set cookie
// function setCookie(name: string, value: string, days?: number) {
//   let expires = "";
//   if (days) {
//     const date = new Date();
//     date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
//     expires = "; expires=" + date.toUTCString();
//   }
//   document.cookie = name + "=" + (value || "") + expires + "; path=/";
// }
//
// // Utility function to ensure refresh token is in cookies
// function ensureRefreshTokenCookie() {
//   const refreshToken = localStorage.getItem("refresh_token") ??
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2JiMWEyYS1hOTg2LTQyMzMtYTQyYy01NjVhOGZlMjE5NGMiLCJyb2xlIjoiYWRtaW4iLCJqdGkiOiIxNzU0NDY2NzU0ODM4LTQ3MzgzYmI3NjFkNWQ3NDJhNmVkMzVjZGRhOTVmYzkxIiwiaWF0IjoxNzU0NDY2NzU0LCJleHAiOjE3NTcwNTg3NTR9.tYQI8-04yXcHRc2VHgqKJUj9MOUu2klo-lfMSQxjv9s";
//
//   if (refreshToken) {
//     setCookie("refresh_token", refreshToken, 30); // Set for 30 days
//   }
// }
//
// // Utility function to manually set refresh token cookie with a specific token
// function setRefreshTokenCookie(token: string) {
//   setCookie("refresh_token", token, 30); // Set for 30 days
// }
//
// async function api<T = any>(
//   endpoint: string,
//   options: ApiOptions = {},
// ): Promise<ApiResponse<T>> {
//   const { method = "GET", body, headers = {}, params = {}, schema } = options;
//   const baseUrl =
//     (
//       import.meta.env.VITE_API_BASE_URL || "https://api.osirislabs.xyz/v1"
//     ).replace(/\/$/, "") + "/";
//   const cleanEndpoint = endpoint.replace(/^\//, "");
//   const url = new URL(cleanEndpoint, baseUrl);
//
//   Object.entries(params).forEach(([key, value]) => {
//     if (value !== undefined && value !== null) {
//       url.searchParams.append(key, String(value));
//     }
//   });
//
//   const needsRefreshToken = ['/hub/wallet/create', '/hub/wallet/add', '/logout', '/hub/wallet/'].some(path =>
//     cleanEndpoint.includes(path)
//   );
//
//   if (needsRefreshToken) {
//     ensureRefreshTokenCookie();
//   }
//
//   const token =
//     localStorage.getItem("access_token")
//   const requestHeaders: Record<string, string> = {
//     ...headers,
//   };
//
//   if (token) {
//     requestHeaders.Authorization = `Bearer ${token}`;
//   }
//
//   if (!(body instanceof FormData)) {
//     requestHeaders["Content-Type"] = "application/json";
//   }
//
//   const requestInit: RequestInit = {
//     method,
//     headers: requestHeaders,
//     mode: "cors",
//     credentials: "include",
//   };
//
//   if (body && method !== "GET") {
//     if (body instanceof FormData) {
//       requestInit.body = body;
//     } else {
//       requestInit.body = JSON.stringify(body);
//     }
//   }
//
//   try {
//     const response = await fetch(url.toString(), requestInit);
//     let data: any;
//     const contentType = response.headers.get("content-type");
//
//     if (contentType?.includes("application/json")) {
//       data = await response.json();
//     } else {
//       data = await response.text();
//     }
//
//     if (response.status === 401) {
//       localStorage.removeItem("access_token");
//       localStorage.removeItem("refresh_token");
//       window.location.href = "/";
//       throw new ApiError(401, data, "Unauthorized");
//     }
//
//     if (!response.ok) {
//       throw new ApiError(
//         response.status,
//         data,
//         data?.error || `HTTP ${response.status}`,
//       );
//     }
//
//     if (schema && data) {
//       try {
//         schema.parse(data);
//       } catch (validationError) {
//         console.warn("API response validation failed:", validationError);
//       }
//     }
//
//     return data;
//   } catch (error) {
//     console.error("API Error:", error);
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     if (error instanceof TypeError && error.message.includes("fetch")) {
//       throw new ApiError(0, null, "Network error - possible CORS issue");
//     }
//     throw new ApiError(
//       0,
//       null,
//       error instanceof Error ? error.message : "Network error",
//     );
//   }
// }
//
// export { api, ApiError, setCookie, ensureRefreshTokenCookie, setRefreshTokenCookie };
// export type { ApiResponse, ApiOptions };

