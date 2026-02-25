import { API_BASE_URL, authHeaders, toForm } from './base';
import type { Grupo, Miembro, ProyectoGrupo } from '../types/grupo';
import type {
  SkambaResponse,
  SkambaResponseGetProyectos,
} from '../types/shared';

// ------------------------------
// Grupos
// ------------------------------

export async function skambaCrearGrupo(
  token: string,
  gru_nom: string,
  usu_des: number,
): Promise<{ success: boolean; message: string; gru_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaCrearGrupo/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_nom, usu_des }),
  });

  if (!response.ok) {
    throw new Error('Error al crear grupo');
  }

  return response.json();
}

export async function skambaEditarGrupo(
  token: string,
  gru_ide: number,
  gru_nom: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEditarGrupo/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_ide, gru_nom }),
  });

  if (!response.ok) {
    throw new Error('Error al editar grupo');
  }

  return response.json();
}

export async function skambaEliminarGrupo(
  token: string,
  gru_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarGrupo/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar grupo');
  }

  return response.json();
}

export async function skambaConseguirGruposUsuario(
  token: string,
  usu_ide: number,
): Promise<{ success: boolean; data: Grupo[] }> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirGruposUsuario/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ usu_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener grupos del usuario');
  }

  return response.json();
}

// ------------------------------
// Miembros
// ------------------------------

export async function skambaAgregarMiembro(
  token: string,
  gru_ide: number,
  usu_ide: number,
): Promise<{ success: boolean; message: string; g_e_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaAgregarMiembro/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_ide, usu_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al agregar miembro al grupo');
  }

  return response.json();
}

export async function skambaEliminarMiembro(
  token: string,
  gru_ide: number,
  usu_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarMiembro/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_ide, usu_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar miembro del grupo');
  }

  return response.json();
}

export async function skambaConseguirMiembros(
  token: string,
  gru_ide: number,
): Promise<{ success: boolean; data: Miembro[] }> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirMiembros/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener miembros del grupo');
  }

  return response.json();
}

// ------------------------------
// Grupo-Proyecto
// ------------------------------

export async function skambaAgregarGrupoProyecto(
  token: string,
  gru_ide: number,
  pro_ide: number,
): Promise<{ success: boolean; message: string; gpp_ide: number }> {
  const response = await fetch(`${API_BASE_URL}skambaAgregarGrupoProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gru_ide, pro_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al vincular grupo con proyecto');
  }

  return response.json();
}

export async function skambaEliminarGrupoProyecto(
  token: string,
  gpp_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarGrupoProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ gpp_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al desvincular grupo del proyecto');
  }

  return response.json();
}

export async function skambaConseguirProyectosGrupo(
  token: string,
  usu_ide: number,
  gru_ide: number,
): Promise<{
  success: boolean;
  data: ProyectoGrupo[];
}> {
  const response = await fetch(
    `${API_BASE_URL}skambaConseguirProyectosGrupo/`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: toForm({ usu_ide, gru_ide }),
    },
  );

  if (!response.ok) {
    throw new Error('Error al obtener proyectos del grupo');
  }

  return response.json();
}

export async function skambaConseguirProyectosUsuarios(
  token: string,
  usu_ide: number,
): Promise<SkambaResponseGetProyectos> {
  const response = await fetch(
    `${API_BASE_URL}skambaConseguirProyectosUsuarios/`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: toForm({ usu_ide }),
    },
  );

  if (!response.ok) {
    throw new Error('Error al obtener proyectos del usuario en grupo');
  }

  return response.json();
}

export async function skambaConseguirProyectosUsuario(
  token: string,
  usu_ide: number,
): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}skambaConseguirProyectosUsuario/?usu_ide=${usu_ide}`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    throw new Error('Error al obtener workspaces del usuario miembro');
  }

  return response.json();
}

export async function skambaAgregarUsuarioProyectoMiembro(
  token: string,
  gru_ide: number,
  usu_ide: number,
  pro_ide: number,
): Promise<{ success: boolean; message: string; p_m_ide: string }> {
  const response = await fetch(
    `${API_BASE_URL}skambaAgregarUsuarioProyectoMiembro/`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: toForm({ gru_ide, usu_ide, pro_ide }),
    },
  );

  if (!response.ok) {
    throw new Error('Error al agregar usuario al proyecto miembro');
  }

  return response.json();
}
