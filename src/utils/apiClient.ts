export async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });
  return response.json();
}
