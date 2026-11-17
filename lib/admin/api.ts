export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

/** Jahan admin login hota hai. 401 ya Sign out par yahin bhejenge. */
export const LOGIN_PATH = "/admin/login";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function signOut() {
  try {
    sessionStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    /* ignore */
  }
  window.location.assign(LOGIN_PATH);
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("adminToken");
  if (!token) {
    signOut();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    signOut();
    throw new ApiError(data.message || "Your session has expired.", 401);
  }
  if (!res.ok || data.success === false) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}