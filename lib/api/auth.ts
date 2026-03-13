import apiClient from './client';
import type { SkambaResponse, LoginResponse } from '../types/shared';

// ------------------------------
// Auth Endpoints
// ------------------------------

export async function skambaLogin(
  user: string,
  pass: string,
): Promise<SkambaResponse<LoginResponse>> {
  const response = await apiClient.post('skambaLogin/', new URLSearchParams({ user, pass }));
  return response.data;
}

export async function skambaLoginGoogle(
  credential: string,
): Promise<SkambaResponse<LoginResponse>> {
  const response = await apiClient.post('skambaLoginGoogle/', new URLSearchParams({ credential }));
  return response.data;
}

export async function skambaCreateUser(
  usu_nom: string,
  usu_ema: string,
  usu_pas: string,
  usu_tel: string,
): Promise<SkambaResponse> {
  const response = await apiClient.post('skambaCreateUser/', new URLSearchParams({ usu_nom, usu_ema, usu_pas, usu_tel }));
  return response.data;
}

export async function skambaReLogin(): Promise<{
  success: boolean;
  message: string;
  token: string;
  ses_ide: number;
  usu_ide: number;
  per_ide: number;
}> {
  const response = await apiClient.post('skambaReLogin/');
  return response.data;
}

