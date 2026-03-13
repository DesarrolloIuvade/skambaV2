import apiClient from './client';
import { toForm } from './base';
import type { Usuario } from '../types/usuario';

/**
 * Usuarios API refactored to use apiClient.
 */

export async function skambaUsuarios(
  _token: string,
): Promise<{ success: boolean; data: Usuario[] }> {
  const response = await apiClient.post('skambaUsuarios/', toForm({}));
  const payload = response.data;
  const usuarios = payload?.data ?? payload?.usuarios ?? [];

  return {
    success: Boolean(payload?.success),
    data: Array.isArray(usuarios) ? usuarios : [],
  };
}
