export interface Grupo {
  gru_ide: number;
  gru_nom: string;
  usu_des: number;
}

export interface Miembro {
  usu_ide: number;
  usu_nom: string;
  usu_ema: string;
  g_e_ide: number;
}

export interface ProyectoGrupo {
  pro_ide: number;
  pro_nom: string;
  pro_tip: string;
  gpp_ide: number;
}
