import { API_BASE_URL, authHeaders, toForm } from './base';
import type { Usuario } from '../types/usuario';

// ------------------------------
// Usuarios
// ------------------------------

export async function skambaUsuarios(
  token: string,
): Promise<{ success: boolean; data: Usuario[] }> {
  const response = await fetch(`${API_BASE_URL}skambaUsuarios/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({}),
  });

  if (!response.ok) {
    throw new Error('Error al obtener usuarios');
  }

  const payload = await response.json();
  const usuarios = payload?.data ?? payload?.usuarios ?? [];

  return {
    success: Boolean(payload?.success),
    data: Array.isArray(usuarios) ? usuarios : [],
  };
}
