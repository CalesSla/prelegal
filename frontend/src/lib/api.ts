/**Typed API client for Prelegal backend endpoints.*/

export interface User {
  id: number;
  email: string;
}

export interface DocumentSummary {
  id: number;
  template_id: string;
  title: string;
  values: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface SavedDoc {
  id: number;
  values: Record<string, string>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || "Request failed");
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getMe(): Promise<User> {
  return request<User>("/api/auth/me");
}

export async function signIn(email: string, password: string): Promise<User> {
  return request<User>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp(email: string, password: string): Promise<User> {
  return request<User>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut(): Promise<void> {
  const res = await fetch("/api/auth/signout", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new ApiError(res.status, "Sign out failed");
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  return request<DocumentSummary[]>("/api/documents");
}

export async function createDocument(
  templateId: string,
  title: string,
  values: Record<string, string>,
): Promise<DocumentSummary> {
  return request<DocumentSummary>("/api/documents", {
    method: "POST",
    body: JSON.stringify({ template_id: templateId, title, values }),
  });
}

export async function updateDocument(
  id: number,
  values: Record<string, string>,
): Promise<DocumentSummary> {
  return request<DocumentSummary>(`/api/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
}
