// Base response types
export interface SkambaResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  id?: number;
  token?: string;
}

export interface SkambaResponseProyecto<T = any> {
  success: boolean;
  message: string;
  pro_ide: number;
}

export interface SkambaResponseGetProyectos {
  success: boolean;
  data: import('./proyecto').Workspace[];
}

// Login types
export interface LoginResponse {
  usuario: string;
  hoy: string;
  nombre: string;
  id: string | number;
}

export interface LoginMeta {
  usuario: string;
  hoy: string;
  token: string;
}
