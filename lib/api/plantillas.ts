import { API_BASE_URL, authHeaders, toForm } from './base';
import type {
  Plantilla,
  CrearPlantillaResponse,
  EdicionPlantillaResponse,
  CrearPlantillaTarea,
  ResponsePlantillas,
} from '../types/plantilla';

// ------------------------------
// Plantillas
// ------------------------------

export async function skambaCrearPlantilla(
  token: string,
  pla_nom: string,
  usu_ide: number,
): Promise<CrearPlantillaResponse> {
  const response = await fetch(`${API_BASE_URL}skambaCrearPlantilla/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pla_nom, usu_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al crear plantilla');
  }
  const data: CrearPlantillaResponse = await response.json();
  return data;
}

export async function skambaEditarPlantilla(
  token: string,
  pla_ide: number,
  pla_nom: string,
): Promise<EdicionPlantillaResponse> {
  const response = await fetch(`${API_BASE_URL}skambaEditarPlantilla/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pla_ide, pla_nom }),
  });

  if (!response.ok) {
    throw new Error('Error al editar plantilla');
  }
  const data: EdicionPlantillaResponse = await response.json();
  return data;
}

export async function skambaEliminarPlantilla(
  token: string,
  pla_ide: number,
): Promise<EdicionPlantillaResponse> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarPlantilla/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pla_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar plantilla');
  }

  const data: EdicionPlantillaResponse = await response.json();

  return data;
}

export async function skambaCrearPlantillaTarea(
  token: string,
  pla_ide: number,
  p_t_nom: string,
  p_t_pad?: number,
): Promise<CrearPlantillaTarea> {
  const body: Record<string, unknown> = { pla_ide, p_t_nom };
  if (p_t_pad !== undefined) body.p_t_pad = p_t_pad;

  const response = await fetch(`${API_BASE_URL}skambaCrearPlantillaTarea/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm(body),
  });

  if (!response.ok) {
    throw new Error('Error al crear tarea de plantilla');
  }

  const data: CrearPlantillaTarea = await response.json();

  return data;
}

export async function skambaEditarPlantillaTarea(
  token: string,
  p_t_ide: number,
  p_t_nom: string,
): Promise<EdicionPlantillaResponse> {
  const response = await fetch(`${API_BASE_URL}skambaEditarPlantillaTarea/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ p_t_ide, p_t_nom }),
  });

  if (!response.ok) {
    throw new Error('Error al editar tarea de plantilla');
  }

  const data: EdicionPlantillaResponse = await response.json();

  return data;
}

export async function skambaEliminarPlantillaTarea(
  token: string,
  p_t_ide: number,
): Promise<EdicionPlantillaResponse> {
  const response = await fetch(`${API_BASE_URL}skambaEliminarPlantillaTarea/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ p_t_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar tarea de plantilla');
  }

  const data: EdicionPlantillaResponse = await response.json();

  return data;
}

export async function skambaMostrarPlantillas(
  token: string,
): Promise<ResponsePlantillas> {
  const response = await fetch(`${API_BASE_URL}skambaMostrarPlantillas/`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Error al listar plantillas');
  }
  const data: ResponsePlantillas = await response.json();
  return data;
}

export async function skambaMostrarPlantilla(
  token: string,
  pla_ide: number,
): Promise<ResponsePlantillas> {
  const response = await fetch(
    `${API_BASE_URL}skambaMostrarPlantilla/?pla_ide=${pla_ide}`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    throw new Error('Error al obtener plantilla');
  }

  const data: ResponsePlantillas = await response.json();

  return data;
}

export async function skambaAplicarPlantilla(
  token: string,
  pla_ide: number,
  pro_ide: number,
): Promise<{ success: boolean; message: string; tareas: number[] }> {
  const response = await fetch(`${API_BASE_URL}skambaAplicarPlantilla/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: toForm({ pla_ide, pro_ide }),
  });

  if (!response.ok) {
    throw new Error('Error al aplicar plantilla');
  }

  return response.json();
}
