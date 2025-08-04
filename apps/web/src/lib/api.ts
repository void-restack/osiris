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

async function api<T = any>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, params = {}, schema } = options;
  const baseUrl =
    (
      import.meta.env.VITE_API_BASE_URL || "https://api.osirislabs.xyz/v1"
    ).replace(/\/$/, "") + "/";
  const cleanEndpoint = endpoint.replace(/^\//, "");
  const url = new URL(cleanEndpoint, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const token =
    localStorage.getItem("access_token") ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YWRlMzM4Ni04Y2VkLTQyNjEtYjUxNC03MzY1ZGZlNzczZmUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQxMjMwOTEsImV4cCI6MTc1NDIwOTQ5MX0._Px9uDNp8vhROJzC0cx3v6JbeXvWn5tGEVq8Odgr-RQ";
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

  try {
    const response = await fetch(url.toString(), requestInit);
    let data: any;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
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

export { api, ApiError };
export type { ApiResponse, ApiOptions };
