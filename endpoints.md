# SKamba API - Endpoints

Todos los endpoints se llaman via POST al router. El body se envia como JSON con los parametros indicados.
Los endpoints marcados con **AUTH** requieren token en el header.

---

## 1. Autenticacion (SKamba)

### `skambaCreateUser`

Registrar usuario nuevo.

```
Clase: SKamba -> createUser
Params: { usu_nom, usu_ema, usu_pas, usu_tel }
Response: { success, message, id }
```

### `skambaLogin`

Iniciar sesion.

```
Clase: SKamba -> login
Params: { user, pass }
Response: { success, message, meta: { usuario, hoy, token }, data: { usuario, hoy, id } }
```

### `skambaReLogin` **AUTH**

Validar sesion activa.

```
Clase: SKamba -> reLogin
Params: {}
Response: { success, message, token, ses_ide, usu_ide, per_ide }
```

---

## 2. Proyectos (SKambaProyecto)

### `skambaCrearProyecto` **AUTH**

Crear proyecto. Si `pro_pad = 0` o `pro_tip = "proyect"` se crea como workspace.
Solo tipo `list` recibe estados automaticamente.

```
Clase: SKambaProyecto -> crearProyecto
Params: { pro_nom, usu_ide, pro_pad?, pro_tip: "workspace"|"folder"|"list" }
Response: { success, message, pro_ide }
```

**Logica de tipos:**
| pro_tip | pro_pad | Comportamiento |
|---------|---------|----------------|
| workspace | 0 | Proyecto raiz |
| folder | pro_ide de un workspace | Carpeta dentro del workspace |
| list | pro_ide de un folder | Lista con estados asignados automaticamente |

### `skambaEditarProyecto` **AUTH**

Editar nombre del proyecto.

```
Clase: SKambaProyecto -> editarProyecto
Params: { pro_ide, pro_nom }
Response: { success, message }
```

### `skambaConseguirProyecto` **AUTH**

Obtener proyecto con datos anidados segun su tipo.

```
Clase: SKambaProyecto -> conseguirProyecto
Params: { pro_ide }
```

**Response segun tipo:**

**list:**

```json
{
  "success": true,
  "data": {
    "pro_ide": 1,
    "pro_nom": "...",
    "pro_tip": "list",
    "tareas": [{ "tar_ide": 1, "tar_nom": "...", "tar_est": 1, "pro_ide": 1 }],
    "estados": [
      {
        "p_e_ide": 1,
        "est_ide": 1,
        "est_nom": "To Do",
        "color": "#ccc",
        "est_ord": 1
      }
    ]
  }
}
```

**folder:**

```json
{
  "success": true,
  "data": {
    "pro_ide": 2, "pro_nom": "...", "pro_tip": "folder",
    "listas": [
      {
        "pro_ide": 3, "pro_nom": "Lista 1", "pro_tip": "list",
        "tareas": [...],
        "estados": [...]
      }
    ]
  }
}
```

**workspace:**

```json
{
  "success": true,
  "data": {
    "pro_ide": 4, "pro_nom": "...", "pro_tip": "workspace",
    "folders": [
      {
        "pro_ide": 5, "pro_nom": "Folder 1", "pro_tip": "folder",
        "listas": [
          {
            "pro_ide": 6, "pro_nom": "Lista 1",
            "tareas": [...],
            "estados": [...]
          }
        ]
      }
    ]
  }
}
```

---

## 3. Tareas (SKambaTareas)

### `skambaCrearTarea` **AUTH**

Crear tarea dentro de un proyecto tipo list.

```
Clase: SKambaTareas -> crearTarea
Params: {
  pro_ide,        // requerido - proyecto tipo list
  tar_nom,        // requerido - nombre
  tar_des?,       // descripcion (default "")
  usu_des?,       // usuario asignado (default 0)
  tar_fch?,       // fecha limite
  pri_ide?,       // prioridad (default 0)
  tar_est?,       // estado (p_e_ide de proyecto_estado)
  tar_pad?        // tarea padre para subtareas (default 0)
}
Response: { success, message, tar_ide }
```

### `skambaEditarTarea` **AUTH**

Editar tarea. Solo envia los campos que cambien.

```
Clase: SKambaTareas -> editarTarea
Params: {
  tar_ide,        // requerido
  tar_nom?,       // campos opcionales a actualizar
  tar_des?,
  usu_des?,
  tar_fch?,
  pri_ide?,
  tar_est?,
  tar_pad?
}
Response: { success, message }
```

### `skambaVerTareas` **AUTH**

Listar todas las tareas de un proyecto.

```
Clase: SKambaTareas -> verTareas
Params: { pro_ide }
Response: { success, data: [{ tar_ide, pro_ide, tar_nom, tar_des, usu_des, tar_fch, pri_ide, tar_est, tar_pad }] }
```

### `skambaVerTarea` **AUTH**

Obtener una tarea por ID.

```
Clase: SKambaTareas -> verTarea
Params: { tar_ide }
Response: { tar_ide, pro_ide, tar_nom, tar_des, ... } | null
```

---

## 4. Estados (SKambaEstados)

### `skambaCrearEstado` **AUTH**

Crear un estado global.

```
Clase: SKambaEstados -> crearEstado
Params: { est_nom, color, est_ord? }
Response: { success, message, est_ide }
```

### `skambaEditarEstado` **AUTH**

Editar estado. Solo envia campos que cambien.

```
Clase: SKambaEstados -> editarEstado
Params: { est_ide, est_nom?, est_ord?, color? }
Response: { success, message }
```

### `skambaEliminarEstado` **AUTH**

Eliminar estado (soft delete).

```
Clase: SKambaEstados -> eliminarEstado
Params: { est_ide }
Response: { success, message }
```

### `skambaConseguirEstados` **AUTH**

Listar todos los estados activos.

```
Clase: SKambaEstados -> conseguirEstados
Params: {}
Response: { success, data: [{ est_ide, est_nom, est_ord, color }] }
```

### `skambaConseguirEstadosProyecto` **AUTH**

Obtener estados asignados a un proyecto con detalle.

```
Clase: SKambaEstados -> conseguirEstadosProyecto
Params: { pro_ide }
Response: [{ p_e_ide, pro_ide, est_ide, est_nom, color, est_ord }]
```

### `skambaAgregarEstadoProyecto` **AUTH**

Agregar un estado individual a un proyecto.

```
Clase: SKambaEstados -> agregarEstadoProyecto
Params: { pro_ide, est_ide }
Response: { success, message, p_e_ide }
```

### `skambaQuitarEstadoProyecto` **AUTH**

Quitar un estado de un proyecto.

```
Clase: SKambaEstados -> quitarEstadoProyecto
Params: { p_e_ide }
Response: { success, message }
```

---

## 5. Grupos (SKambaGrupos)

### `skambaCrearGrupo` **AUTH**

Crear grupo de trabajo.

```
Clase: SKambaGrupos -> crearGrupo
Params: { gru_nom, usu_des }
Response: { success, message, gru_ide }
```

### `skambaEditarGrupo` **AUTH**

Editar nombre del grupo.

```
Clase: SKambaGrupos -> editarGrupo
Params: { gru_ide, gru_nom }
Response: { success, message }
```

### `skambaEliminarGrupo` **AUTH**

Eliminar grupo (soft delete).

```
Clase: SKambaGrupos -> eliminarGrupo
Params: { gru_ide }
Response: { success, message }
```

### `skambaAgregarMiembro` **AUTH**

Agregar usuario a un grupo. Valida duplicados.

```
Clase: SKambaGrupos -> agregarMiembro
Params: { gru_ide, usu_ide }
Response: { success, message, g_e_ide }
```

### `skambaEliminarMiembro` **AUTH**

Quitar usuario de un grupo.

```
Clase: SKambaGrupos -> eliminarMiembro
Params: { gru_ide, usu_ide }
Response: { success, message }
```

### `skambaConseguirMiembros` **AUTH**

Listar miembros de un grupo con datos del usuario.

```
Clase: SKambaGrupos -> conseguirMiembros
Params: { gru_ide }
Response: { success, data: [{ usu_ide, usu_nom, usu_ema, g_e_ide }] }
```

### `skambaConseguirGruposUsuario` **AUTH**

Listar grupos donde el usuario es miembro.

```
Clase: SKambaGrupos -> conseguirGruposUsuario
Params: { usu_ide }
Response: { success, data: [{ gru_ide, gru_nom, usu_des }] }
```

### `skambaAgregarGrupoProyecto` **AUTH**

Vincular proyecto a grupo. Crea registro en grupo_proyecto + proyecto_miembro.

```
Clase: SKambaGrupos -> agregarGrupoProyecto
Params: { gru_ide, pro_ide }
Response: { success, message, gpp_ide }
```

### `skambaEliminarGrupoProyecto` **AUTH**

Desvincular proyecto del grupo (soft delete en ambas tablas).

```
Clase: SKambaGrupos -> eliminarGrupoProyecto
Params: { gpp_ide }
Response: { success, message }
```

### `skambaConseguirProyectosGrupo` **AUTH**

Obtener proyectos del grupo. Valida que el usuario sea miembro y que exista proyecto_miembro.

```
Clase: SKambaGrupos -> conseguirProyectosGrupo
Params: { usu_ide, gru_ide }
Response: { success, data: [{ pro_ide, pro_nom, pro_tip, gpp_ide }] }
```

**Flujo de validacion:**

```
usu_ide en grupo_equipo? -> grupo_proyecto del grupo -> proyecto_miembro existe? -> datos del proyecto
```

---

## 6. Plantillas (SKambaPlantilla)

### `skambaCrearPlantilla` **AUTH**

Crear plantilla de tareas.

```
Clase: SKambaPlantilla -> crearPlantilla
Params: { pla_nom, usu_ide }
Response: { success, message, pla_ide }
```

### `skambaEditarPlantilla` **AUTH**

Editar nombre de plantilla.

```
Clase: SKambaPlantilla -> editarPlantilla
Params: { pla_ide, pla_nom }
Response: { success, message }
```

### `skambaEliminarPlantilla` **AUTH**

Eliminar plantilla (soft delete).

```
Clase: SKambaPlantilla -> eliminarPlantilla
Params: { pla_ide }
Response: { success, message }
```

### `skambaCrearPlantillaTarea` **AUTH**

Agregar tarea a una plantilla.

```
Clase: SKambaPlantilla -> crearPlantillaTarea
Params: {
  pla_ide,    // requerido - plantilla padre
  p_t_nom,    // requerido - nombre de la tarea
  p_t_pad?    // dependencia (ref a otro p_t_ide, default 0)
}
Response: { success, message, p_t_ide }
```

### `skambaEditarPlantillaTarea` **AUTH**

Editar tarea de plantilla.

```
Clase: SKambaPlantilla -> editarPlantillaTarea
Params: { p_t_ide, p_t_nom }
Response: { success, message }
```

### `skambaEliminarPlantillaTarea` **AUTH**

Eliminar tarea de plantilla (soft delete).

```
Clase: SKambaPlantilla -> eliminarPlantillaTarea
Params: { p_t_ide }
Response: { success, message }
```

### `skambaMostrarPlantillas` **AUTH**

Listar todas las plantillas con sus tareas.

```
Clase: SKambaPlantilla -> mostrarPlantillas
Params: {}
Response: {
  success,
  data: [
    {
      pla_ide, pla_nom, usu_ide,
      tareas: [{ p_t_ide, pla_ide, p_t_nom, p_t_pad }]
    }
  ]
}
```

### `skambaMostrarPlantilla` **AUTH**

Ver una plantilla con sus tareas.

```
Clase: SKambaPlantilla -> mostrarPlantilla
Params: { pla_ide }
Response: { success, data: { pla_ide, pla_nom, tareas: [...] } }
```

### `skambaAplicarPlantilla` **AUTH**

Aplica plantilla a un proyecto: crea tareas reales con el estado inicial del proyecto.

```
Clase: SKambaPlantilla -> aplicarPlantilla
Params: { pla_ide, pro_ide }
Response: { success, message, tareas: [tar_ide, tar_ide, ...] }
```

**Flujo:**

```
1. Obtiene plantilla_tarea WHERE pla_ide
2. Obtiene proyecto_estado del proyecto, ordena por est_ord, toma el primero
3. Crea tareas raiz (p_t_pad=0) -> INSERT tarea con tar_est=estado_inicial, p_t_ide=referencia
4. Crea subtareas (p_t_pad!=0) -> mapea dependencias al tar_ide nuevo
```

---

## 7. Comentarios (SKambaComentario)

### `skambaHacerComentario` **AUTH**

Crear comentario en una tarea.

```
Clase: SKambaComentario -> crearComentario
Params: { tar_ide, t_c_com }
Response: { success, message, t_a_ide, tar_ide }
```

### `skambaTareaComentarios` **AUTH**

Obtener comentarios de una tarea ordenados por fecha.

```
Clase: SKambaComentario -> tareaComentarios
Params: { tar_ide }
Response: { success, comentarios: [{ t_a_ide, tar_ide, t_c_com, t_c_gen, usu_ide }] }
```

### `skambaEliminarComentario` **AUTH**

Eliminar comentario (soft delete).

```
Clase: SKambaComentario -> eliminarComentario
Params: { t_a_ide }
Response: { success, message, t_a_ide }
```

---

## 8. Archivos (SKambaArchivos)

### `skambaSubirArchivo` **AUTH**

Subir archivos a una tarea. Envia como multipart/form-data.

```
Clase: SKambaArchivos -> subirArchivo
Params: { tar_ide } + FILES
Response: { success, message, archivos: [{ t_a_ide, adj_ide }] }
```

### `skambaConseguirArchivos` **AUTH**

Listar archivos de una tarea.

```
Clase: SKambaArchivos -> getArchivos
Params: { tar_ide }
Response: { success, archivos: [{ t_a_ide, adj_ide, fil_nam, fil_ext, fil_typ, fil_siz }] }
```

### `skambaConseguirArchivo` **AUTH**

Descargar un archivo por adj_ide. Retorna el binario del archivo.

```
Clase: SKambaArchivos -> getFile
Params: { adj_ide }
Response: binario del archivo (Content-type segun fil_typ)
```

### `skambaEliminarArchivo` **AUTH**

Eliminar archivo de una tarea (soft delete).

```
Clase: SKambaArchivos -> eliminarArchivo
Params: { t_a_ide }
Response: { success, message, t_a_ide }
```

---

## Esquema de Base de Datos

```
kamba.proyecto       (pro_ide, pro_nom, usu_ide, pro_pad, est_ado, pro_tip)
kamba.tarea          (tar_ide, pro_ide, tar_nom, tar_des, usu_des, tar_gen, tar_fch, pri_ide, est_ado, tar_est, p_t_ide, tar_pad)
kamba.estado         (est_ide, est_nom, est_ord, est_ado, color)
kamba.proyecto_estado(p_e_ide, pro_ide, est_ide, est_ado)
kamba.grupo          (gru_ide, gru_nom, usu_des, est_ado)
kamba.grupo_equipo   (g_e_ide, gru_ide, usu_ide, est_ado)
kamba.grupo_proyecto (gpp_ide, gru_ide, pro_ide, est_ado)
kamba.proyecto_miembro(p_m_ide, pro_ide, gpp_ide, p_m_gen)
kamba.plantilla      (pla_ide, pla_nom, usu_ide, est_ado)
kamba.plantilla_tarea(p_t_ide, pla_ide, p_t_nom, p_t_pad, est_ado)
kamba.tarea_comentario(t_a_ide, tar_ide, t_c_com, t_c_gen, est_ado, usu_ide)
kamba.tarea_archivo  (t_a_ide, tar_ide, adj_ide, est_ado)
kamba.usuario        (usu_ide, usu_nom, usu_ema, usu_pas, usu_tel, est_ado)
```

## Jerarquia de Proyectos

```
workspace (pro_pad=0)
  └── folder (pro_pad=workspace.pro_ide)
        └── list (pro_pad=folder.pro_ide)
              ├── tareas
              └── estados (via proyecto_estado)
```
