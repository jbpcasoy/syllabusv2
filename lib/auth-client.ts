import type { RegisterInput, SessionUser } from "@/types/user";

export type LoginInput = { email: string; password: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        message = data.error;
      }
    } catch {
      // body wasn't JSON; keep the default message
    }
    throw new Error(message);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function login(input: LoginInput) {
  return request<SessionUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}

export function register(input: RegisterInput) {
  return request<SessionUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
