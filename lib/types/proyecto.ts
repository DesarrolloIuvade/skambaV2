import type { Tarea, EstadoProyecto } from './tarea';
import type { Miembro } from './grupo';

export interface Lista {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'list';
  tareas: Tarea[];
  estados: EstadoProyecto[];
  miembros?: Miembro[];
  tareas_pendientes?: number;
  tareas_pendientes_total?: number;
}

export interface Folder {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'folder';
  listas: Lista[];
  tareas_pendientes?: number;
  tareas_pendientes_total?: number;
}

export interface Space {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'space';
  contenido: {
    folders: Folder[];
    listas: Lista[];
  };
  tareas_pendientes?: number;
  tareas_pendientes_total?: number;
}

export interface Workspace {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'workspace';
  spaces: Space[];
  tareas_pendientes?: number;
  tareas_pendientes_total?: number;
}

export interface CrearProyecto {
  pro_pad: number;
  pro_tip: string | null;
  pro_nom: string;
  usu_ide: number;
}
