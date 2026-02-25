import { API_BASE_URL, authHeaders, toForm } from './base';
import type { Estado, EstadoProyecto } from '../types/tarea';

// ------------------------------
// Estados
// ------------------------------

export async function skambaCrearEstado(
  token: string,
  est_nom: string,
  color: string,
  est_ord?: number,
): Promise<{ success: boolean; message: string; est_ide: number }> {
  const body: Record<string, unknown> = { est_nom, color };
  if (est_ord !== undefined) body.est_ord = est_ord;

  const response = await fetch(`${API_BASE_URL}skambaCrearEstado/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm(body),
  });

  if (!response.ok) {
    throw new Error('Error al crear estado');
  }

  return response.json();
}

export interface EditarEstadoParams {
  est_ide: number;
  est_nom?: string;
  est_ord?: number;
  color?: string;
}

export async function skambaEditarEstado(
  token: string,
  params: EditarEstadoParams,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEditarEstado/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm(params),
  });

  if (!response.ok) {
    throw new Error('Error al editar estado');
  }

  return response.json();
}

export async function skambaEliminarEstado(
  token: string,
  est_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarEstado/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ est_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar estado');
  }

  return response.json();
}

export async function skambaConseguirEstados(
  token: string,
): Promise<{ success: boolean; data: Estado[] }> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirEstados/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({}),
  });

  if (!response.ok) {
    throw new Error('Error al obtener estados');
  }

  return response.json();
}

export async function skambaConseguirEstadosProyecto(
  token: string,
  pro_ide: number,
): Promise<EstadoProyecto[]> {
  const response = await fetch(
    `${API_BASE_URL}skambaConseguirEstadosProyecto/`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: toForm({ pro_ide }),
    },
  );

  if (!response.ok) {
    throw new Error('Error al obtener estados del proyecto');
  }

  return response.json();
}

export async function skambaAgregarEstadoProyecto(
  token: string,
  pro_ide: number,
  est_ide: number,
): Promise<{ success: boolean; message: string; p_e_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaAgregarEstadoProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pro_ide, est_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al agregar estado al proyecto');
  }

  return response.json();
}

export async function skambaQuitarEstadoProyecto(
  token: string,
  p_e_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaQuitarEstadoProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ p_e_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al quitar estado del proyecto');
  }

  return response.json();
}
