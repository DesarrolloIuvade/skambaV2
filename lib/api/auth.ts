import { API_BASE_URL, authHeaders, toForm } from './base';
import type { SkambaResponse, LoginResponse } from '../types/shared';

// ------------------------------
// Auth Endpoints
// ------------------------------

export async function skambaLogin(
  user: string,
  pass: string,
): Promise<SkambaResponse<LoginResponse>> {
  const response = await fetch(`${API_BASE_URL}skambaLogin/`, {
    method: 'POST',
    body: new URLSearchParams({ user, pass }),
  });

  if (!response.ok) {
    throw new Error('Error en la petición de login');
  }

  return response.json();
}

export async function skambaCreateUser(
  usu_nom: string,
  usu_ema: string,
  usu_pas: string,
  usu_tel: string,
): Promise<SkambaResponse> {
  const response = await fetch(`${API_BASE_URL}skambaCreateUser/`, {
    method: 'POST',
    body: new URLSearchParams({ usu_nom, usu_ema, usu_pas, usu_tel }),
  });

  if (!response.ok) {
    throw new Error('Error en la petición de registro');
  }

  return response.json();
}

export async function skambaReLogin(token: string): Promise<{
  success: boolean;
  message: string;
  token: string;
  ses_ide: number;
  usu_ide: number;
  per_ide: number;
}> {
  const response = await fetch(`${API_BASE_URL}skambaReLogin/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({}),
  });

  if (!response.ok) {
    throw new Error('Error al validar sesión');
  }

  return response.json();
}
