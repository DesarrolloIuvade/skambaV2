import { getApiBaseUrl } from './api/base';

const BASE_URL = getApiBaseUrl();

export async function apiRequest<T>(endpoint: string, body?: any): Promise<T> {
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');
  const res = await fetch(`${BASE_URL}${normalizedEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error('API Error');

  return res.json();
}
