// export const API_BASE_URL = 'https://sm.plataformasvirtuales.pe/sk/api/';

export const API_BASE_URL = 'http://localhost/siggo/api/';

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
