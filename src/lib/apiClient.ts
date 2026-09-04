/**
 * Nexus Supply Chain - Resilient API Client
 * Provides robust error handling for Vercel, static hosting, and full-stack environments.
 * Prevents "Unexpected token 'T', 'The page could not be found' is not valid JSON" errors.
 */

export const API_BASE_URL = (((import.meta as any).env?.VITE_API_URL as string) || '').replace(/\/$/, '');

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  isJson: boolean;
  error?: string;
}

/**
 * Safely executes a fetch and safely parses JSON without throwing SyntaxError on HTML 404s
 */
export async function safeFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = getApiUrl(endpoint);
  
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (isJson) {
      try {
        const data = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data,
          isJson: true,
          error: !res.ok ? (data?.error || data?.message || `HTTP ${res.status}`) : undefined
        };
      } catch (jsonErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null as any,
          isJson: false,
          error: `Failed to parse server response as JSON: ${jsonErr.message}`
        };
      }
    }

    // Response is NOT JSON (e.g., Vercel 404 "The page could not be found" or HTML)
    const rawText = await res.text();
    let friendlyError = `HTTP ${res.status}`;

    if (res.status === 404) {
      friendlyError = `API endpoint "${endpoint}" not found (HTTP 404). If deployed on Vercel, the serverless backend may not be linked or VITE_API_URL is missing.`;
    } else if (res.status === 502 || res.status === 503 || res.status === 504) {
      friendlyError = `Backend server gateway unavailable (HTTP ${res.status}). Server may be cold-starting.`;
    } else if (!res.ok) {
      friendlyError = `Server error (HTTP ${res.status}): ${rawText.slice(0, 100)}`;
    }

    return {
      ok: false,
      status: res.status,
      data: rawText as any,
      isJson: false,
      error: friendlyError
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null as any,
      isJson: false,
      error: `Network error connecting to API: ${netErr.message || 'Server unreachable'}`
    };
  }
}
