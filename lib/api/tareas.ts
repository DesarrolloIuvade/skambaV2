import apiClient from './client';
import { toForm } from './base';
import type {
  Tarea,
  TareaBusquedaGlobal,
  BuscarTareasParams,
  CrearTareaParams,
  EditarTareaParams,
  DashboardMisTareasData,
  EstadoProyecto,
} from '../types/tarea';
import type { Miembro } from '../types/grupo';

// ------------------------------
// Tareas (Refactored to use apiClient)
// ------------------------------

type VerTareasResponse = { success: boolean; data: Tarea[]; miembros?: Miembro[] };

const verTareasInFlight = new Map<number, Promise<VerTareasResponse>>();
const verTareasRecentCache = new Map<number, { ts: number; value: VerTareasResponse }>();
const VER_TAREAS_CACHE_TTL_MS = 300;
let verTareasQueue: Promise<void> = Promise.resolve();

function enqueueVerTareas<T>(runner: () => Promise<T>) {
  const scheduled = verTareasQueue.then(runner, runner);
  verTareasQueue = scheduled.then(
    () => undefined,
    () => undefined,
  );
  return scheduled;
}

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
): Promise<VerTareasResponse> {
  const now = Date.now();
  const cached = verTareasRecentCache.get(pro_ide);
  if (cached && now - cached.ts < VER_TAREAS_CACHE_TTL_MS) {
    return cached.value;
  }

  const existing = verTareasInFlight.get(pro_ide);
  if (existing) return existing;

  const request = enqueueVerTareas(async () => {
    const response = await apiClient.post(
      'skambaVerTareas/',
      toForm({ pro_ide }),
    );
    const value = response.data as VerTareasResponse;
    verTareasRecentCache.set(pro_ide, { ts: Date.now(), value });
    return value;
  }).finally(() => {
    verTareasInFlight.delete(pro_ide);
  });

  verTareasInFlight.set(pro_ide, request);
  return request;
}

export async function skambaVerTarea(
  _token: string,
  tar_ide: number,
  pro_ide?: number,
): Promise<{
  success: boolean;
  data?: Tarea & { est_ide?: string | number | null; est_nom?: string | null };
  miembros?: Miembro[];
  estados?: EstadoProyecto[];
}> {
  try {
    const response = await apiClient.post(
      'skambaVerTarea/',
      toForm({ tar_ide, pro_ide }),
    );
    return response.data;
  } catch {
    return { success: false };
  }
}

function normalizeBuscarTareasResponse(payload: unknown): {
  success: boolean;
  data: TareaBusquedaGlobal[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
} {
  const source =
    payload && typeof payload === 'object'
      ? (payload as {
          success?: boolean;
          data?: unknown;
          tareas?: unknown;
          items?: unknown;
          total?: number;
          page?: number;
          limit?: number;
          message?: string;
        })
      : null;

  const data = Array.isArray(source?.data)
    ? source.data
    : Array.isArray(source?.tareas)
      ? source.tareas
      : Array.isArray(source?.items)
        ? source.items
        : Array.isArray(payload)
          ? payload
          : [];

  return {
    success: typeof source?.success === 'boolean' ? source.success : true,
    data,
    total: source?.total,
    page: source?.page,
    limit: source?.limit,
    message: source?.message,
  };
}

export async function skambaBuscarTareas(
  _token: string,
  params: BuscarTareasParams,
): Promise<{
  success: boolean;
  data: TareaBusquedaGlobal[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}> {
  const response = await apiClient.post('skambaBuscarTareas/', toForm(params));
  return normalizeBuscarTareasResponse(response.data);
}

export async function skambaCopiarTarea(
  token: string,
  tar_ide: number,
  pro_ide: number,
): Promise<{ success: boolean; message: string; tar_ide?: number }> {
  const response = await apiClient.post(
    'skambaCopiarTarea/',
    toForm({ tar_ide, pro_ide, token }),
  );
  return response.data;
}

export async function skambaEliminarTarea(
  _token: string,
  tar_ide: number,
  usu_ide: number,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    'skambaEliminarTarea/',
    toForm({ tar_ide, usu_ide }),
  );
  return response.data;
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

export async function skambaDashboardMisTareas(
  token: string,
): Promise<{
  success: boolean;
  data: DashboardMisTareasData;
  message?: string;
}> {
  const response = await apiClient.get('skambaDashboardMisTareas/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
