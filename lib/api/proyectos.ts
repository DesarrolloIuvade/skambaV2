import { API_BASE_URL, authHeaders, toForm } from './base';
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

export async function skambaCrearProyecto(
  pro_pad: number,
  pro_nom: string,
  usu_ide: number,
  token: string,
  pro_tip?: string,
): Promise<SkambaResponseProyecto<CrearProyecto>> {
  let finalProTip = pro_tip;

  // Si no se envía pro_tip y pro_pad es 0 (o no se envía, asumiendo 0), es un workspace
  if (!finalProTip && (pro_pad === 0 || !pro_pad)) {
    finalProTip = 'workspace';
  }

  const body: Record<string, unknown> = { pro_pad, pro_nom, usu_ide };
  if (finalProTip) body.pro_tip = finalProTip;

  const response = await fetch(`${API_BASE_URL}skambaCrearProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm(body),
  });

  if (!response.ok) {
    throw new Error('Error en la petición de crear proyecto');
  }

  return response.json();
}

export async function skambaEditarProyecto(
  token: string,
  pro_ide: number,
  pro_nom: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}skambaEditarProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pro_ide, pro_nom }),
  });

  if (!response.ok) {
    throw new Error('Error al editar proyecto');
  }

  return response.json();
}

export async function skambaConseguirProyecto(
  token: string,
  pro_ide: number,
): Promise<{ success: boolean; data: Lista | Folder | Workspace }> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirProyecto/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pro_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener proyecto');
  }

  return response.json();
}

export async function skambaConseguirProyectos(
  token: string,
  usu_ide: number,
): Promise<SkambaResponseGetProyectos> {
  const response = await fetch(`${API_BASE_URL}skambaConseguirProyectos/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ usu_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener proyectos');
  }

  return response.json();
}
