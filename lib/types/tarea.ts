import type { Miembro } from './grupo';

export interface Tarea {
  tar_ide: string;
  pro_ide: string;
  tar_nom: string;
  tar_des: string;
  usu_des: string | null;
  tar_gen: string;
  tar_fch: string | null;
  pri_ide: string | null;
  est_ado: string;
  tar_est: string;
  p_t_ide: string | null;
  tar_pad: string | null;
  com_cnt?: number;
  arc_cnt?: number;
  designado_nombre?: string | null;
  creador_nombre?: string | null;
}

export interface BuscarTareasParams {
  q: string;
  usu_ide?: number;
  est_ide?: number;
  pro_ide?: number;
  page?: number;
  limit?: number;
}

export interface TareaBusquedaGlobal extends Tarea {
  est_nom?: string | null;
  est_ide?: string | number | null;
  p_e_ide?: string | number | null;
  pro_nom?: string | null;
  pro_tip?: string | null;
  lista?: {
    pro_ide?: string | number;
    pro_nom?: string | null;
    pro_tip?: string | null;
    pro_pad?: string | number | null;
  };
}

export interface EstadoProyecto {
  p_e_ide: string;
  pro_ide: string;
  est_ide: string;
  est_ado: string;
  est_nom: string;
  color: string | null;
  est_ord: string;
}

export interface Estado {
  est_ide: number;
  est_nom: string;
  est_ord: number;
  color: string;
}

export interface CrearTareaParams {
  pro_ide: number;
  tar_nom: string;
  tar_des?: string;
  usu_des?: number;
  tar_fch?: string;
  pri_ide?: number;
  tar_est?: number;
  p_t_ide?: number;
  tar_pad?: number;
  token?: string;
}

export interface EditarTareaParams {
  tar_ide: number;
  tar_nom?: string;
  tar_des?: string;
  usu_des?: number | null;
  tar_fch?: string | null;
  pri_ide?: number | null;
  tar_est?: number;
  tar_pad?: number | null;
}

export interface Comentario {
  t_a_ide: number;
  tar_ide: number;
  t_c_com: string;
  t_c_gen: string;
  usu_ide: number;
  usu_cre?: string;
}

export interface Archivo {
  t_a_ide: number;
  adj_ide: number;
  fil_nam: string;
  fil_ext: string;
  fil_typ: string;
  fil_siz: number;
}

export interface DashboardTarea {
  tar_ide: number;
  tar_nom: string;
  tar_des?: string;
  tar_fch?: string | null;
  est_nom?: string;
  pri_ide?: number | null;
  pro_ide?: number | null;
  pro_nom?: string | null;
  usu_des?: number | null;
  lista?: {
    pro_ide: string;
    pro_nom: string;
    pro_tip: 'list' | string;
    pro_pad?: string | null;
  };
}

export interface DashboardResumen {
  resumen: {
    total: number;
    pendientes: number;
    en_proceso: number;
    completas: number;
    vencidas: number;
    asignadas_a_mi: number;
    sin_asignar: number;
    prioridad_alta: number;
  };
  tareas_pendientes_preview: DashboardTarea[];
}

export interface DashboardMisTareasData {
  dashboard: DashboardResumen;
  tareas: DashboardTarea[];
  estados_por_proyecto?: Record<string, EstadoProyecto[]>;
  miembros_por_proyecto?: Record<string, Miembro[]>;
}
