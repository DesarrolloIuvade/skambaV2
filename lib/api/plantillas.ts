import apiClient from './client';
import { toForm } from './base';
import type {
  CrearPlantillaResponse,
  EdicionPlantillaResponse,
  CrearPlantillaTarea,
  ResponsePlantillas,
} from '../types/plantilla';

/**
 * Plantillas API refactored to use apiClient.
 */

export async function skambaCrearPlantilla(
  _token: string,
  pla_nom: string,
  usu_ide: number,
): Promise<CrearPlantillaResponse> {
  const response = await apiClient.post('skambaCrearPlantilla/', toForm({ pla_nom, usu_ide }));
  return response.data;
}

export async function skambaEditarPlantilla(
  _token: string,
  pla_ide: number,
  pla_nom: string,
): Promise<EdicionPlantillaResponse> {
  const response = await apiClient.post('skambaEditarPlantilla/', toForm({ pla_ide, pla_nom }));
  return response.data;
}

export async function skambaEliminarPlantilla(
  _token: string,
  pla_ide: number,
): Promise<EdicionPlantillaResponse> {
  const response = await apiClient.post('skambaEliminarPlantilla/', toForm({ pla_ide }));
  return response.data;
}

export async function skambaCrearPlantillaTarea(
  _token: string,
  pla_ide: number,
  p_t_nom: string,
  p_t_pad?: number,
): Promise<CrearPlantillaTarea> {
  const body: Record<string, unknown> = { pla_ide, p_t_nom };
  if (p_t_pad !== undefined) body.p_t_pad = p_t_pad;

  const response = await apiClient.post('skambaCrearPlantillaTarea/', toForm(body));
  return response.data;
}

export async function skambaEditarPlantillaTarea(
  _token: string,
  p_t_ide: number,
  p_t_nom: string,
): Promise<EdicionPlantillaResponse> {
  const response = await apiClient.post('skambaEditarPlantillaTarea/', toForm({ p_t_ide, p_t_nom }));
  return response.data;
}

export async function skambaEliminarPlantillaTarea(
  _token: string,
  p_t_ide: number,
): Promise<EdicionPlantillaResponse> {
  const response = await apiClient.post('skambaEliminarPlantillaTarea/', toForm({ p_t_ide }));
  return response.data;
}

export async function skambaMostrarPlantillas(
  _token: string,
): Promise<ResponsePlantillas> {
  const response = await apiClient.get('skambaMostrarPlantillas/');
  return response.data;
}

export async function skambaMostrarPlantilla(
  _token: string,
  pla_ide: number,
): Promise<ResponsePlantillas> {
  const response = await apiClient.get('skambaMostrarPlantilla/', {
    params: { pla_ide }
  });
  return response.data;
}

export async function skambaAplicarPlantilla(
  _token: string,
  pla_ide: number,
  pro_ide: number,
): Promise<{ success: boolean; message: string; tareas: number[] }> {
  const response = await apiClient.post('skambaAplicarPlantilla/', toForm({ pla_ide, pro_ide }));
  return response.data;
}
