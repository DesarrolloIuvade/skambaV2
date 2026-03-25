# Estructura de API Modular

Esta carpeta contiene la organización modular del código API de Skamba.

## Estructura de Directorios

```
lib/
├── api/               # Funciones de API organizadas por dominio
│   ├── base.ts        # Utilidades base (API_BASE_URL, authHeaders, toForm)
│   ├── auth.ts        # Autenticación (login, registro, reLogin)
│   ├── proyectos.ts   # Proyectos, workspaces, spaces, folders, listas
│   ├── tareas.ts      # CRUD de tareas
│   ├── estados.ts     # Gestión de estados
│   ├── grupos.ts      # Grupos y miembros
│   ├── plantillas.ts  # Plantillas y plantillas de tareas
│   ├── comentarios.ts # Comentarios de tareas
│   ├── archivos.ts    # Archivos adjuntos
│   ├── usuarios.ts    # Usuarios
│   └── index.ts       # Re-exporta todas las funciones de API
│
├── types/             # Tipos TypeScript organizados por dominio
│   ├── shared.ts      # Tipos base y respuestas comunes
│   ├── proyecto.ts    # Workspace, Space, Folder, Lista
│   ├── tarea.ts       # Tarea, Estado, Comentario, Archivo
│   ├── grupo.ts       # Grupo, Miembro
│   ├── plantilla.ts   # Plantilla, PlantillaTarea
│   ├── usuario.ts     # Usuario
│   └── index.ts       # Re-exporta todos los tipos
│
├── api.ts             # ⚠️ DEPRECADO - Mantener temporalmente para compatibilidad
├── apiClient.ts       # Cliente API genérico
└── index.ts           # Punto de entrada principal - Re-exporta todo
```

## Uso

### Importar desde el punto de entrada centralizado (RECOMENDADO)

```typescript
import {
  skambaLogin,
  skambaConseguirProyectos,
  type Workspace,
  type Tarea,
  API_BASE_URL,
} from '@/lib';
```

### Importar desde archivos específicos

```typescript
import { skambaLogin } from '@/lib/api/auth';
import { skambaCrearTarea } from '@/lib/api/tareas';
import type { Workspace } from '@/lib/types/proyecto';
```

## Migración desde api.ts

### Antes

```typescript
import { skambaLogin, Workspace } from '../lib/api';
```

### Después

```typescript
import { skambaLogin, type Workspace } from '@/lib';
// o
import { skambaLogin } from '@/lib/api';
import type { Workspace } from '@/lib/types';
```

## Organización de Funciones

### auth.ts

- `skambaLogin(user, pass)`
- `skambaCreateUser(usu_nom, usu_ema, usu_pas, usu_tel)`
- `skambaReLogin(token)`

### proyectos.ts

- `skambaCrearProyecto(pro_pad, pro_nom, usu_ide, token, pro_tip?)`
- `skambaEditarProyecto(token, pro_ide, pro_nom)`
- `skambaConseguirProyecto(token, pro_ide)`
- `skambaConseguirProyectos(token, usu_ide)`
- `skambaConseguirProyectosGrupo(token, gru_ide)`
- `skambaConseguirProyectosUsuarios(token, usu_ide)`

### tareas.ts

- Funciones CRUD de tareas

### estados.ts

- Gestión de estados de proyectos

### grupos.ts

- CRUD de grupos y miembros
- `skambaAgregarUsuarioProyectoMiembro(token, gru_ide, usu_ide, pro_ide)`

### plantillas.ts

- CRUD de plantillas y plantillas de tareas

### comentarios.ts

- CRUD de comentarios

### archivos.ts

- Gestión de archivos adjuntos

### usuarios.ts

- `skambaUsuarios(token)`

## Próximos Pasos

1. ✅ Crear estructura de tipos en `types/`
2. ✅ Crear `base.ts` con utilidades comunes
3. ✅ Migrar funciones de autenticación a `auth.ts`
4. ✅ Migrar funciones de proyectos a `proyectos.ts`
5. ⏳ Completar migración de funciones restantes
6. ⏳ Actualizar imports en componentes
7. ⏳ Eliminar `api.ts` cuando todos los componentes estén actualizados

## Notas

- El archivo `api.ts` se mantendrá temporalmente para evitar romper código existente
- Los componentes deben migrar gradualmente a usar los nuevos imports
- Todas las nuevas funcionalidades deben agregarse en los archivos modulares, no en `api.ts`
