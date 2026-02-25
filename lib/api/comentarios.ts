import { API_BASE_URL, authHeaders, toForm } from './base';
import type { Comentario } from '../types/tarea';

// ------------------------------
// Comentarios
// ------------------------------

export async function skambaHacerComentario(
  token: string,
  tar_ide: number,
  t_c_com: string,
): Promise<{
  success: boolean;
  message: string;
  t_a_ide: number;
  tar_ide: number;
}> {
  const response = await fetch(`${API_BASE_URL}skambaHacerComentario/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ tar_ide, t_c_com }),
  });

  if (!response.ok) {
    throw new Error('Error al crear comentario');
  }

  return response.json();
}

export async function skambaTareaComentarios(
  token: string,
  tar_ide: number,
): Promise<{ success: boolean; comentarios: Comentario[] }> {
  const response = await fetch(`${API_BASE_URL}skambaTareaComentarios/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ tar_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener comentarios');
  }

  return response.json();
}

export async function skambaEliminarComentario(
  token: string,
  t_a_ide: number,
): Promise<{ success: boolean; message: string; t_a_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarComentario/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ t_a_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar comentario');
  }

  return response.json();
}
