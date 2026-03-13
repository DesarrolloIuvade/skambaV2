import apiClient from './client';
import { toForm } from './base';
import type { Archivo } from '../types/tarea';

/**
 * Archivos API refactored to use apiClient.
 */

export async function skambaSubirArchivo(
  _token: string,
  tar_ide: number,
  files: File[],
): Promise<{
  success: boolean;
  message: string;
  archivos: { t_a_ide: number; adj_ide: number }[];
}> {
  const formData = new FormData();
  formData.append('tar_ide', String(tar_ide));
  files.forEach((file) => formData.append('files', file));

  const response = await apiClient.post('skambaSubirArchivo/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function skambaConseguirArchivos(
  _token: string,
  tar_ide: number,
): Promise<{ success: boolean; archivos: Archivo[] }> {
  const response = await apiClient.post('skambaConseguirArchivos/', toForm({ tar_ide }));
  return response.data;
}

export async function skambaConseguirArchivo(
  _token: string,
  adj_ide: number,
): Promise<Blob> {
  const response = await apiClient.post('skambaConseguirArchivo/', toForm({ adj_ide }), {
    responseType: 'blob',
  });
  return response.data;
}

export async function skambaEliminarArchivo(
  _token: string,
  t_a_ide: number,
): Promise<{ success: boolean; message: string; t_a_ide: number }> {
  const response = await apiClient.post('skambaEliminarArchivo/', toForm({ t_a_ide }));
  return response.data;
}
