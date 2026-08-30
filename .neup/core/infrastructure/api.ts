const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://neupgroup.com/estate').replace(/\/$/, '');

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(
  endpoint: string,
  method: ApiMethod = 'GET',
  headers: HeadersInit = {},
  data?: unknown,
): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const requestHeaders = new Headers(headers);
  let body: BodyInit | undefined;

  if (data !== undefined && method !== 'GET') {
    if (isFormData) body = data as FormData;
    else {
      requestHeaders.set('Content-Type', requestHeaders.get('Content-Type') ?? 'application/json');
      body = JSON.stringify(data);
    }
  }

  const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body,
  });
  const result = await response.json().catch(() => null) as T;
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return result;
}
