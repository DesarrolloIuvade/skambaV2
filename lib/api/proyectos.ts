import apiClient from './client';
import type {
  SkambaResponseProyecto,
  SkambaResponseGetProyectos,
} from '../types/shared';
import type {
  Workspace,
  Folder,
  Lista,
  CrearProyecto,
} from '../types/proyecto';

/**
 * Refactored using apiClient. Token is now handled by interceptors.
 */

export async function skambaCrearProyecto(
  pro_pad: number,
  pro_nom: string,
  usu_ide: number,
  _token?: string, // Kept for backward compatibility but ignored
  pro_tip?: string,
  est_ides?: number[],
): Promise<SkambaResponseProyecto<CrearProyecto>> {
  let finalProTip = pro_tip;

  if (!finalProTip && (pro_pad === 0 || !pro_pad)) {
    finalProTip = 'workspace';
  }

  const params = new URLSearchParams();
  params.append('pro_pad', String(pro_pad));
  params.append('pro_nom', pro_nom);
  params.append('usu_ide', String(usu_ide));
  if (finalProTip) params.append('pro_tip', finalProTip);

  if (est_ides && est_ides.length > 0) {
    for (const id of est_ides) {
      params.append('est_ides[]', String(id));
    }
  }

  const response = await apiClient.post('skambaCrearProyecto/', params);
  return response.data;
}

export async function skambaEditarProyecto(
  _token: string,
  pro_ide: number,
  pro_nom: string,
): Promise<{ success: boolean; message: string }> {
  const params = new URLSearchParams();
  params.append('pro_ide', String(pro_ide));
  params.append('pro_nom', pro_nom);

  const response = await apiClient.post('skambaEditarProyecto/', params);
  return response.data;
}

export async function skambaConseguirProyecto(
  _token: string,
  pro_ide: number,
): Promise<{ success: boolean; data: Lista | Folder | Workspace }> {
  const params = new URLSearchParams();
  params.append('pro_ide', String(pro_ide));

  const response = await apiClient.post('skambaConseguirProyecto/', params);
  return response.data;
}

export async function skambaEliminarProyecto(
  _token: string,
  pro_ide: number,
): Promise<{ success: boolean; message: string }> {
  const params = new URLSearchParams();
  params.append('pro_ide', String(pro_ide));

  const response = await apiClient.post('skambaEliminarProyecto/', params);
  return response.data;
}

export async function skambaConseguirProyectos(
  _token: string,
): Promise<SkambaResponseGetProyectos> {
  const params = new URLSearchParams();
  params.append('token',_token);
  const response = await apiClient.post('skambaConseguirProyectos/', params, {
    headers: { Authorization: null } as any
  });
  return response.data;
}

export async function skambaConseguirProyectosUsuario(
  _token: string,
  usu_ide: number,
): Promise<SkambaResponseGetProyectos> {
  const params = new URLSearchParams();
  params.append('usu_ide', String(usu_ide));

  const response = await apiClient.post('skambaConseguirProyectosUsuario/', params);
  return response.data;
}
