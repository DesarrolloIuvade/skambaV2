# SKamba Frontend — Guía de API

Todas las funciones viven en `lib/api.ts` y se importan así:

```ts
import { skambaLogin, skambaCrearTarea, ... } from '@/lib/api';
```

El token de sesión se obtiene en el login y debe pasarse como primer argumento en todos los endpoints marcados con **AUTH**.

---

## 1. Autenticación

### Registrar usuario

```ts
const res = await skambaCreateUser(usu_nom, usu_ema, usu_pas, usu_tel);
// res: { success, message, id }
```

### Login

```ts
const res = await skambaLogin(user, pass);
// res.meta.token  → guardar en contexto/sesión
// res.data.id     → usu_ide del usuario
// res.data.usuario → datos del usuario
```

### Validar sesión activa (ReLogin)

Llamar al iniciar la app para verificar si el token guardado sigue vigente.

```ts
const res = await skambaReLogin(token);
// res: { success, token, ses_ide, usu_ide, per_ide }
```

---

## 2. Proyectos

La jerarquía es: `workspace → folder → list`. Solo los `list` tienen tareas y estados.

### Crear workspace

```ts
const res = await skambaCrearProyecto(0, 'Mi Workspace', usu_ide, token, 'workspace');
// res.pro_ide → ID del workspace creado
```

### Crear folder dentro de un workspace

```ts
const res = await skambaCrearProyecto(workspace_pro_ide, 'Mi Folder', usu_ide, token, 'folder');
```

### Crear list dentro de un folder

```ts
const res = await skambaCrearProyecto(folder_pro_ide, 'Mi Lista', usu_ide, token, 'list');
// Al crear un list, el backend asigna estados automáticamente
```

### Editar nombre de proyecto

```ts
await skambaEditarProyecto(token, pro_ide, 'Nuevo nombre');
```

### Obtener un proyecto con datos anidados

Retorna estructura distinta según el tipo (`list`, `folder`, `workspace`).

```ts
const res = await skambaConseguirProyecto(token, pro_ide);
// res.data → Lista | Folder | Workspace

// Si es list:   res.data.tareas, res.data.estados
// Si es folder: res.data.listas[].tareas / .estados
// Si es workspace: res.data.folders[].listas[].tareas / .estados
```

### Listar todos los proyectos del usuario

```ts
const res = await skambaConseguirProyectos(token, usu_ide);
// res.data → Workspace[]  (con folders y listas anidadas)
```

---

## 3. Tareas

Las tareas solo existen dentro de un proyecto tipo `list`.

### Crear tarea

```ts
const res = await skambaCrearTarea(token, {
  pro_ide,         // list donde se crea
  tar_nom: 'Tarea nueva',
  tar_des: 'Descripción opcional',
  usu_des: usu_ide,   // usuario asignado (opcional)
  tar_fch: '2026-03-01', // fecha límite (opcional)
  pri_ide: 1,           // prioridad (opcional)
  tar_est: p_e_ide,     // estado inicial (p_e_ide del proyecto_estado)
  tar_pad: 0,           // 0 = tarea raíz, otro tar_ide = subtarea
});
// res.tar_ide → ID de la tarea creada
```

### Editar tarea (solo campos que cambien)

```ts
await skambaEditarTarea(token, {
  tar_ide,
  tar_nom: 'Nuevo nombre',
  tar_est: nuevo_p_e_ide,
});
```

### Listar tareas de un proyecto

```ts
const res = await skambaVerTareas(token, pro_ide);
// res.data → Tarea[]
```

### Obtener una tarea por ID

```ts
const tarea = await skambaVerTarea(token, tar_ide);
// tarea → Tarea | null
```

---

## 4. Estados

Los estados son globales y se asignan a proyectos tipo `list`.

### Crear estado global

```ts
const res = await skambaCrearEstado(token, 'En progreso', '#3b82f6', 2);
// res.est_ide
```

### Editar estado (solo campos que cambien)

```ts
await skambaEditarEstado(token, { est_ide, color: '#ef4444' });
```

### Eliminar estado (soft delete)

```ts
await skambaEliminarEstado(token, est_ide);
```

### Listar todos los estados activos

```ts
const res = await skambaConseguirEstados(token);
// res.data → Estado[]  { est_ide, est_nom, est_ord, color }
```

### Estados de un proyecto específico

```ts
const estados = await skambaConseguirEstadosProyecto(token, pro_ide);
// estados → EstadoProyecto[]  { p_e_ide, pro_ide, est_ide, est_nom, color, est_ord }
// Usar p_e_ide como tar_est al crear/mover tareas
```

### Agregar estado a un proyecto

```ts
const res = await skambaAgregarEstadoProyecto(token, pro_ide, est_ide);
// res.p_e_ide
```

### Quitar estado de un proyecto

```ts
await skambaQuitarEstadoProyecto(token, p_e_ide);
```

---

## 5. Grupos

Los grupos agrupan usuarios y proyectos.

### Crear grupo

```ts
const res = await skambaCrearGrupo(token, 'Equipo Dev', usu_ide);
// res.gru_ide
```

### Editar grupo

```ts
await skambaEditarGrupo(token, gru_ide, 'Nuevo nombre');
```

### Eliminar grupo (soft delete)

```ts
await skambaEliminarGrupo(token, gru_ide);
```

### Agregar usuario al grupo

```ts
const res = await skambaAgregarMiembro(token, gru_ide, usu_ide);
// res.g_e_ide
```

### Quitar usuario del grupo

```ts
await skambaEliminarMiembro(token, gru_ide, usu_ide);
```

### Listar miembros del grupo

```ts
const res = await skambaConseguirMiembros(token, gru_ide);
// res.data → Miembro[]  { usu_ide, usu_nom, usu_ema, g_e_ide }
```

### Grupos donde participa un usuario

```ts
const res = await skambaConseguirGruposUsuario(token, usu_ide);
// res.data → Grupo[]  { gru_ide, gru_nom, usu_des }
```

### Vincular proyecto a grupo

```ts
const res = await skambaAgregarGrupoProyecto(token, gru_ide, pro_ide);
// res.gpp_ide
```

### Desvincular proyecto de grupo

```ts
await skambaEliminarGrupoProyecto(token, gpp_ide);
```

### Proyectos del grupo visibles para el usuario

```ts
const res = await skambaConseguirProyectosGrupo(token, usu_ide, gru_ide);
// res.data → [{ pro_ide, pro_nom, pro_tip, gpp_ide }]
```

---

## 6. Plantillas

Las plantillas permiten crear conjuntos de tareas reutilizables y aplicarlos a proyectos.

### Crear plantilla

```ts
const res = await skambaCrearPlantilla(token, 'Onboarding', usu_ide);
// res.pla_ide
```

### Editar plantilla

```ts
await skambaEditarPlantilla(token, pla_ide, 'Nuevo nombre');
```

### Eliminar plantilla

```ts
await skambaEliminarPlantilla(token, pla_ide);
```

### Agregar tarea a plantilla

```ts
const res = await skambaCrearPlantillaTarea(token, pla_ide, 'Configurar entorno');
// Para subtarea: pasar p_t_pad con el p_t_ide del padre
const sub = await skambaCrearPlantillaTarea(token, pla_ide, 'Instalar dependencias', res.p_t_ide);
```

### Editar tarea de plantilla

```ts
await skambaEditarPlantillaTarea(token, p_t_ide, 'Nuevo nombre');
```

### Eliminar tarea de plantilla

```ts
await skambaEliminarPlantillaTarea(token, p_t_ide);
```

### Listar todas las plantillas con sus tareas

```ts
const res = await skambaMostrarPlantillas(token);
// res.data → Plantilla[]  { pla_ide, pla_nom, usu_ide, tareas: PlantillaTarea[] }
```

### Ver una plantilla

```ts
const res = await skambaMostrarPlantilla(token, pla_ide);
// res.data → Plantilla
```

### Aplicar plantilla a un proyecto list

El backend crea las tareas reales usando el primer estado del proyecto como estado inicial.

```ts
const res = await skambaAplicarPlantilla(token, pla_ide, pro_ide);
// res.tareas → number[]  (tar_ide de cada tarea creada)
```

---

## 7. Comentarios

### Crear comentario en una tarea

```ts
const res = await skambaHacerComentario(token, tar_ide, 'Texto del comentario');
// res.t_a_ide
```

### Listar comentarios de una tarea

```ts
const res = await skambaTareaComentarios(token, tar_ide);
// res.comentarios → Comentario[]  { t_a_ide, tar_ide, t_c_com, t_c_gen, usu_ide }
```

### Eliminar comentario

```ts
await skambaEliminarComentario(token, t_a_ide);
```

---

## 8. Archivos

### Subir archivos a una tarea

Usa `FormData` internamente; recibe un array de objetos `File` del DOM.

```ts
const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
const files = Array.from(input.files ?? []);

const res = await skambaSubirArchivo(token, tar_ide, files);
// res.archivos → [{ t_a_ide, adj_ide }]
```

### Listar archivos de una tarea

```ts
const res = await skambaConseguirArchivos(token, tar_ide);
// res.archivos → Archivo[]  { t_a_ide, adj_ide, fil_nam, fil_ext, fil_typ, fil_siz }
```

### Descargar archivo (retorna Blob)

```ts
const blob = await skambaConseguirArchivo(token, adj_ide);
const url = URL.createObjectURL(blob);
// Abrir o descargar según fil_typ
```

### Eliminar archivo

```ts
await skambaEliminarArchivo(token, t_a_ide);
```

---

## Tipos exportados

| Tipo | Campos clave |
|---|---|
| `Tarea` | `tar_ide`, `tar_nom`, `tar_des`, `tar_est`, `tar_pad`, `usu_des`, `tar_fch`, `pri_ide` |
| `EstadoProyecto` | `p_e_ide`, `est_ide`, `est_nom`, `color`, `est_ord` |
| `Estado` | `est_ide`, `est_nom`, `color`, `est_ord` |
| `Lista` | `pro_ide`, `pro_nom`, `tareas[]`, `estados[]` |
| `Folder` | `pro_ide`, `pro_nom`, `listas[]` |
| `Workspace` | `pro_ide`, `pro_nom`, `folders[]` |
| `Grupo` | `gru_ide`, `gru_nom`, `usu_des` |
| `Miembro` | `usu_ide`, `usu_nom`, `usu_ema`, `g_e_ide` |
| `Plantilla` | `pla_ide`, `pla_nom`, `tareas[]` |
| `PlantillaTarea` | `p_t_ide`, `pla_ide`, `p_t_nom`, `p_t_pad` |
| `Comentario` | `t_a_ide`, `tar_ide`, `t_c_com`, `t_c_gen`, `usu_ide` |
| `Archivo` | `t_a_ide`, `adj_ide`, `fil_nam`, `fil_ext`, `fil_typ`, `fil_siz` |
| `CrearTareaParams` | todos los campos de tarea con opcionales |
| `EditarTareaParams` | igual que crear pero todos opcionales excepto `tar_ide` |
| `EditarEstadoParams` | `est_ide` + opcionales `est_nom`, `est_ord`, `color` |

---

## Notas importantes

- **Token**: siempre pasar el token como primer argumento en funciones AUTH. El backend lo espera en el header `Authorization`.
- **tar_est**: al crear/editar tareas, el valor es el `p_e_ide` (de `proyecto_estado`), no el `est_ide` global.
- **pro_tip list**: solo los proyectos tipo `list` aceptan tareas. Los `folder` y `workspace` son contenedores.
- **Soft delete**: eliminar grupos, estados, plantillas, comentarios y archivos no borra el registro, solo lo desactiva.
- **skambaConseguirArchivo**: retorna `Blob`, no JSON. Usar `URL.createObjectURL` para previsualizar o descargar.
