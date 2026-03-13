import type { Tarea, EstadoProyecto } from './tarea';

export interface Lista {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'list';
  tareas: Tarea[];
  estados: EstadoProyecto[];
}

export interface Folder {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'folder';
  listas: Lista[];
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
}

export interface Workspace {
  pro_ide: string;
  pro_nom: string;
  usu_ide: string;
  pro_pad: string;
  est_ado: string;
  pro_tip: 'workspace';
  spaces: Space[];
}

export interface CrearProyecto {
  pro_pad: number;
  pro_tip: string | null;
  pro_nom: string;
  usu_ide: number;
}
