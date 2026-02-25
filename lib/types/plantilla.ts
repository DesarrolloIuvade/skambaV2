export interface PlantillaTarea {
  p_t_ide: number;
  pla_ide: number;
  p_t_nom: string;
  p_t_pad: number;
}

export interface Plantilla {
  pla_ide: number;
  pla_nom: string;
  usu_ide: number;
  tareas: PlantillaTarea[];
}

export interface CrearPlantillaResponse {
  success: boolean;
  message: string;
  pla_ide: string;
}

export interface EdicionPlantillaResponse {
  success: boolean;
  message: string;
}

export interface CrearPlantillaTarea {
  success: boolean;
  message: string;
  p_t_ide: string;
}

export interface ResponsePlantillas {
  success: boolean;
  data: Plantilla[];
}
