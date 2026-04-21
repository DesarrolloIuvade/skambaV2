const DEFAULT_API_BASE_URL = 'https://sm.plataformasvirtuales.pe/sk/api/';

function trimQuotes(value: string) {
  return value.replace(/^['"]+|['"]+$/g, '');
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeProtocol(value: string) {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    value.startsWith('http://')
  ) {
    return value.replace(/^http:\/\//i, 'https://');
  }

  return value;
}

export function getApiBaseUrl() {
  const envValue = process.env.NEXT_PUBLIC_API_URL?.trim();
  const configured = envValue ? trimQuotes(envValue) : DEFAULT_API_BASE_URL;
  return ensureTrailingSlash(normalizeProtocol(configured));
}

export const API_BASE_URL = getApiBaseUrl();

function authHeaders(token: string): Record<string, string> {
  return { Authorization: token };
}

function toForm(params: Record<string, any>): URLSearchParams {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }
  return form;
}

export { authHeaders, toForm };
