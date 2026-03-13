import apiClient from './client';
import { toForm } from './base';
import type { Estado, EstadoProyecto } from '../types/tarea';

// ------------------------------
// Estados (Refactored to use apiClient)
// ------------------------------

export async function skambaCrearEstado(
  _token: string,
  est_nom: string,
  color: string,
  est_ord?: number,
): Promise<{ success: boolean; message: string; est_ide: number }> {
  const body: Record<string, unknown> = { est_nom, color };
  if (est_ord !== undefined) body.est_ord = est_ord;

  const response = await apiClient.post('skambaCrearEstado/', toForm(body));
  return response.data;
}

export interface EditarEstadoParams {
  est_ide: number;
  est_nom?: string;
  est_ord?: number;
  color?: string;
}

export async function skambaEditarEstado(
  _token: string,
  params: EditarEstadoParams,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('skambaEditarEstado/', toForm(params));
  return response.data;
}

export async function skambaEliminarEstado(
  _token: string,
  est_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('skambaEliminarEstado/', toForm({ est_ide }));
  return response.data;
}

export async function skambaConseguirEstados(
  _token: string,
): Promise<{ success: boolean; data: Estado[] }> {
  const response = await apiClient.post('skambaConseguirEstados/', toForm({}));
  return response.data;
}

export async function skambaConseguirEstadosProyecto(
  _token: string,
  pro_ide: number,
): Promise<EstadoProyecto[]> {
  const response = await apiClient.post('skambaConseguirEstadosProyecto/', toForm({ pro_ide }));
  return response.data;
}

export async function skambaAgregarEstadoProyecto(
  _token: string,
  pro_ide: number,
  est_ide: number,
): Promise<{ success: boolean; message: string; p_e_ide: number }> {
  const response = await apiClient.post('skambaAgregarEstadoProyecto/', toForm({ pro_ide, est_ide }));
  return response.data;
}

export async function skambaEliminarEstadosProyecto(
  _token: string,
  pro_ide: number,
  est_ides?: number[],
): Promise<{ success: boolean; message: string }> {
  const form = toForm({ pro_ide });
  if (est_ides && est_ides.length > 0) {
    for (const id of est_ides) {
      form.append('est_ides[]', String(id));
    }
  }

  const response = await apiClient.post('skambaEliminarEstadosProyecto/', form);
  return response.data;
}

export async function skambaQuitarEstadoProyecto(
  _token: string,
  p_e_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('skambaQuitarEstadoProyecto/', toForm({ p_e_ide }));
  return response.data;
}
