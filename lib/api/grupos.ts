import apiClient from './client';
import { toForm } from './base';
import type { Grupo, Miembro, ProyectoGrupo } from '../types/grupo';
import type { SkambaResponseGetProyectos } from '../types/shared';

// ------------------------------
// Grupos (Refactored to use apiClient)
// ------------------------------

export async function skambaCrearGrupo(
  _token: string,
  gru_nom: string,
): Promise<{ success: boolean; message: string; gru_ide: number }> {
  const response = await apiClient.post(
    'skambaCrearGrupo/',
    toForm({ gru_nom }),
  );
  return response.data;
}

export async function skambaEditarGrupo(
  _token: string,
  gru_ide: number,
  gru_nom: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    'skambaEditarGrupo/',
    toForm({ gru_ide, gru_nom }),
  );
  return response.data;
}

export async function skambaEliminarGrupo(
  _token: string,
  gru_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    'skambaEliminarGrupo/',
    toForm({ gru_ide }),
  );
  return response.data;
}

export async function skambaConseguirGruposUsuario(
  _token: string,
  usu_ide: number,
): Promise<{ success: boolean; data: Grupo[] }> {
  const response = await apiClient.post(
    'skambaConseguirGruposUsuario/',
    toForm({ usu_ide }),
  );
  return response.data;
}

// ------------------------------
// Miembros
// ------------------------------

export async function skambaAgregarMiembro(
  _token: string,
  gru_ide: number,
  usu_ema: string,
): Promise<{
  success: boolean;
  message: string;
  g_e_ide: number;
  usu_ide: number;
  usu_nom: string;
}> {
  const response = await apiClient.post(
    'skambaAgregarMiembro/',
    toForm({ gru_ide, usu_ema }),
  );
  return response.data;
}

export async function skambaEliminarMiembro(
  _token: string,
  gru_ide: number,
  usu_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    'skambaEliminarMiembro/',
    toForm({ gru_ide, usu_ide }),
  );
  return response.data;
}

export async function skambaConseguirMiembros(
  _token: string,
  gru_ide: number,
): Promise<{ success: boolean; data: Miembro[] }> {
  const response = await apiClient.post(
    'skambaConseguirMiembros/',
    toForm({ gru_ide }),
  );
  return response.data;
}

// Eliminamos esto
// export async function skambaMiembrosProyecto(
// _token: string,
// pro_ide: number,
// ): Promise<{ success: boolean; data: Miembro[]; message?: string }> {
// const response = await apiClient.post(
// 'skambaMiembrosProyecto/',
// toForm({ pro_ide }),
// );
// return response.data;
// }

// ------------------------------
// Grupo-Proyecto
// ------------------------------

export async function skambaAgregarGrupoProyecto(
  _token: string,
  gru_ide: number,
  pro_ide: number,
): Promise<{ success: boolean; message: string; gpp_ide: number }> {
  const response = await apiClient.post(
    'skambaAgregarGrupoProyecto/',
    toForm({ gru_ide, pro_ide }),
  );
  return response.data;
}

export async function skambaEliminarGrupoProyecto(
  _token: string,
  gpp_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    'skambaEliminarGrupoProyecto/',
    toForm({ gpp_ide }),
  );
  return response.data;
}

export async function skambaConseguirProyectosGrupo(
  _token: string,
  gru_ide: number,
): Promise<{
  success: boolean;
  data: ProyectoGrupo[];
}> {
  const response = await apiClient.post(
    'skambaConseguirProyectosGrupo/',
    toForm({ gru_ide }),
  );
  return response.data;
}

export async function skambaConseguirProyectosUsuarios(
  _token: string,
  usu_ide: number,
): Promise<SkambaResponseGetProyectos> {
  const response = await apiClient.post(
    'skambaConseguirProyectosUsuarios/',
    toForm({ usu_ide }),
  );
  return response.data;
}

export async function skambaConseguirProyectosUsuarioGet(
  _token: string,
  usu_ide: number,
): Promise<any> {
  // Note: The original was using GET with query params, keep that behavior
  const response = await apiClient.get(
    `skambaConseguirProyectosUsuario/?usu_ide=${usu_ide}`,
  );
  return response.data;
}

export async function skambaConseguirProyectosGrupoUsuario(
  _token: string,
  gru_ide: number,
  usu_ide: number,
): Promise<{ success: boolean; data: any[] }> {
  const response = await apiClient.post(
    'skambaConseguirProyectosGrupoUsuario/',
    toForm({ gru_ide, usu_ide }),
  );
  return response.data;
}

export async function skambaConseguirProyectosGrupoUsuarioPorUsuario(
  _token: string,
  usu_ide: number,
): Promise<{ success: boolean; data: any[] }> {
  const response = await apiClient.get(
    `skambaConseguirProyectosGrupoUsuario/?usu_ide=${usu_ide}`,
  );
  return response.data;
}

export async function skambaAgregarUsuariosLista(
  _token: string,
  usu_ema: string,
  pro_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    'skambaAgregarUsuariosLista/',
    toForm({ usu_ema, pro_ide }),
  );
  return response.data;
}

export async function skambaMostrarProyectosMiembro(
  _token: string,
  usu_ide: number,
): Promise<{ success: boolean; data: any[] }> {
  const response = await apiClient.post(
    'skambaMostrarProyectosMiembro/',
    toForm({ usu_ide }),
    { headers: { Authorization: _token } },
  );
  return response.data;
}
