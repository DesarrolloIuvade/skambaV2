import { API_BASE_URL, authHeaders, toForm } from './base';
import type {
  Tarea,
  CrearTareaParams,
  EditarTareaParams,
} from '../types/tarea';

// ------------------------------
// Tareas
// ------------------------------

export async function skambaCrearTarea(
  token: string,
  params: CrearTareaParams,
): Promise<{ success: boolean; message: string; tar_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaCrearTarea/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm(params),
  });

  if (!response.ok) {
    throw new Error('Error al crear tarea');
  }

  return response.json();
}

export async function skambaEditarTarea(
  token: string,
  params: EditarTareaParams,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEditarTarea/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm(params),
  });

  if (!response.ok) {
    throw new Error('Error al editar tarea');
  }

  return response.json();
}

export async function skambaVerTareas(
  token: string,
  pro_ide: number,
): Promise<{ success: boolean; data: Tarea[] }> {
  const response = await fetch(`${API_BASE_URL}skambaVerTareas/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pro_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al listar tareas');
  }

  return response.json();
}

export async function skambaVerTarea(
  token: string,
  tar_ide: number,
): Promise<Tarea | null> {
  const response = await fetch(`${API_BASE_URL}skambaVerTarea/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ tar_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener tarea');
  }

  return response.json();
}
