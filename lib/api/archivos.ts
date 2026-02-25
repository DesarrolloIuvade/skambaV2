import { API_BASE_URL, authHeaders, toForm } from './base';
import type { Archivo } from '../types/tarea';

// ------------------------------
// Archivos
// ------------------------------

export async function skambaSubirArchivo(
  token: string,
  tar_ide: number,
  files: File[],
): Promise<{
  success: boolean;
  message: string;
  archivos: { t_a_ide: number; adj_ide: number }[];
}> {
  // FormData: NO se agrega Content-Type, el browser lo pone con el boundary
  const formData = new FormData();
  formData.append('tar_ide', String(tar_ide));
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_BASE_URL}skambaSubirArchivo/`, {
    method: 'POST',
    headers: { Authorization: token },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error al subir archivo');
  }

  return response.json();
}

export async function skambaConseguirArchivos(
  token: string,
  tar_ide: number,
): Promise<{ success: boolean; archivos: Archivo[] }> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirArchivos/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ tar_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener archivos');
  }

  return response.json();
}

export async function skambaConseguirArchivo(
  token: string,
  adj_ide: number,
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirArchivo/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ adj_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al descargar archivo');
  }

  return response.blob();
}

export async function skambaEliminarArchivo(
  token: string,
  t_a_ide: number,
): Promise<{ success: boolean; message: string; t_a_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarArchivo/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ t_a_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar archivo');
  }

  return response.json();
}
