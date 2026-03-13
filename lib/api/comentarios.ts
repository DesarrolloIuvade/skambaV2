import apiClient from './client';
import { toForm } from './base';
import type { Comentario } from '../types/tarea';

/**
 * Comentarios API refactored to use apiClient.
 */

export async function skambaHacerComentario(
  _token: string,
  tar_ide: number,
  t_c_com: string,
): Promise<{
  success: boolean;
  message: string;
  t_a_ide: number;
  tar_ide: number;
}> {
  const response = await apiClient.post('skambaHacerComentario/', toForm({ tar_ide, t_c_com }));
  return response.data;
}

export async function skambaTareaComentarios(
  _token: string,
  tar_ide: number,
): Promise<{ success: boolean; comentarios: Comentario[] }> {
  const response = await apiClient.post('skambaTareaComentarios/', toForm({ tar_ide }));
  return response.data;
}

export async function skambaEliminarComentario(
  _token: string,
  t_a_ide: number,
): Promise<{ success: boolean; message: string; t_a_ide: number }> {
  const response = await apiClient.post('skambaEliminarComentario/', toForm({ t_a_ide }));
  return response.data;
}
