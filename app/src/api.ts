const API_BASE = "https://g6xoo9pwuh.execute-api.eu-north-1.amazonaws.com/prod";

export const apiFetch = (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};
