import apiClient from './client';
import { toForm } from './base';
import type {
  Tarea,
  CrearTareaParams,
  EditarTareaParams,
} from '../types/tarea';

// ------------------------------
// Tareas (Refactored to use apiClient)
// ------------------------------

export async function skambaCrearTarea(
  token: string,
  params: CrearTareaParams,
): Promise<{ success: boolean; message: string; tar_ide: number }> {
  const response = await apiClient.post(
    'skambaCrearTarea/',
    toForm({ ...params, token }),
  );
  return response.data;
}

export async function skambaEditarTarea(
  _token: string,
  params: EditarTareaParams,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('skambaEditarTarea/', toForm(params));
  return response.data;
}

export async function skambaVerTareas(
  _token: string,
  pro_ide: number,
): Promise<{ success: boolean; data: Tarea[] }> {
  const response = await apiClient.post(
    'skambaVerTareas/',
    toForm({ pro_ide }),
  );
  return response.data;
}

export async function skambaVerTarea(
  _token: string,
  tar_ide: number,
): Promise<Tarea | null> {
  const response = await apiClient.post('skambaVerTarea/', toForm({ tar_ide }));
  return response.data.success ? response.data.data : null;
}

export interface TareaLog {
  t_e_ide: string;
  tar_ide: string;
  tar_nom?: string;
  tar_est?: string;
  p_e_ide?: string;
  est_ide?: string;
  est_nom?: string;
  t_e_tim: string;
  usu_ide: string;
  usu_nom?: string;
  est_ado: string;
}

export async function skambaLogsTareas(
  _token: string,
  tar_ide: number,
): Promise<{ success: boolean; data: TareaLog[] }> {
  const response = await apiClient.get('skambaLogsTareas/', {
    params: { tar_ide },
  });
  return response.data;
}
