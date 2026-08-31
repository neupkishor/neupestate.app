const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://neupgroup.com/estate').replace(/\/$/, '');

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  body: T;
};

export type RunApiOptions = {
  baseUrl: string;
  path: string;
  method?: ApiMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  headers?: HeadersInit;
  bearerToken?: string | null;
  cookies?: Record<string, string | null | undefined>;
};

export async function runApi<T = unknown>(options: RunApiOptions): Promise<ApiResponse<T>> {
  const query = Object.entries(options.query ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const url = `${options.baseUrl.replace(/\/$/, '')}${options.path}${query ? `?${query}` : ''}`;
  const headers = new Headers(options.headers);
  if (options.bearerToken) headers.set('Authorization', `Bearer ${options.bearerToken}`);
  const cookies = Object.entries(options.cookies ?? {}).filter(([, value]) => value);
  if (cookies.length) headers.set('Cookie', cookies.map(([key, value]) => `${key}=${value}`).join('; '));

  const method = options.method ?? 'GET';
  let body: BodyInit | undefined;
  if (options.body !== undefined && method !== 'GET') {
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) body = options.body;
    else {
      headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
      body = JSON.stringify(options.body);
    }
  }
  const response = await fetch(url, { method, headers, body });
  const bodyResult = await response.json().catch(() => null) as T;
  return { ok: response.ok, status: response.status, body: bodyResult };
}

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
