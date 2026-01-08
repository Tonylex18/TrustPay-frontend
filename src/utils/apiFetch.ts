import { clearStoredToken } from "./api";

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const response = await fetch(input, init);

  if (response.status === 401 || response.status === 501) {
    clearStoredToken();

    if (!window.location.pathname.startsWith("/login")) {
      window.location.replace("/login");
    }
  }

  return response;
}
