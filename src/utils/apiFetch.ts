import { getStoredToken } from "./api";
import { authEvents } from "./authEvents";

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const token = getStoredToken();

  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401 || response.status === 501) {
    authEvents.emitUnauthorized();
  }

  return response;
}
