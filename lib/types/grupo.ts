export interface Grupo {
  gru_ide: number;
  gru_nom: string;
  usu_des: number;
}

export interface Miembro {
  usu_ide: number;
  usu_nom: string;
  usu_ema: string;
  g_e_ide?: number;
  // Campos opcionales para miembros de proyecto
  p_m_ide?: number;
  pro_ide?: string | number;
  pro_nom?: string;
  pro_tip?: string;
  usu_tel?: string;
  p_m_gen?: string;
  p_m_pem?: string;
  est_ado?: string;
}

export interface ProyectoGrupo {
  pro_ide: number;
  pro_nom: string;
  pro_tip: string;
  gpp_ide: number;
}
