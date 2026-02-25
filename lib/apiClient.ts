const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest<T>(endpoint: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
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
