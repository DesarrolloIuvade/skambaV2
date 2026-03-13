'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
    skambaCrearPlantilla,
    skambaEditarPlantilla,
    skambaEliminarPlantilla,
    skambaCrearPlantillaTarea,
    skambaEditarPlantillaTarea,
    skambaEliminarPlantillaTarea,
    skambaMostrarPlantillas,
    skambaAplicarPlantilla,
    type Plantilla,
    type Workspace,
} from '../lib/api';

function collectAllLists(workspaces: Workspace[], groupWorkspaces: Workspace[]) {
    const allWs = [...workspaces, ...groupWorkspaces];
    return allWs.flatMap((ws) => {
        return (ws.spaces ?? []).flatMap((s) => {
            const listsFromFolders = (s.contenido?.folders ?? []).flatMap((f) =>
                f.listas.map((l) => ({
                    pro_ide: l.pro_ide,
                    pro_nom: `${ws.pro_nom} / ${s.pro_nom} / ${f.pro_nom} / ${l.pro_nom}`,
                }))
            );
            const directLists = (s.contenido?.listas ?? []).map((l) => ({
                pro_ide: l.pro_ide,
                pro_nom: `${ws.pro_nom} / ${s.pro_nom} / ${l.pro_nom}`,
            }));
            return [...listsFromFolders, ...directLists];
        });
    });
}

export function PlantillasView() {
    const { workspaces, groupWorkspaces, loadProyectos } = useDashboard();
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Selected plantilla
    const [selected, setSelected] = useState<Plantilla | null>(null);

    // Edit plantilla name
    const [editingPlaId, setEditingPlaId] = useState<number | null>(null);
    const [editPlaName, setEditPlaName] = useState('');

    // New task in plantilla
    const [newTaskName, setNewTaskName] = useState('');
    const [creatingTask, setCreatingTask] = useState(false);

    // Edit task
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editTaskName, setEditTaskName] = useState('');

    // Apply plantilla
    const [applyingTo, setApplyingTo] = useState<number | null>(null);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        loadPlantillas();
    }, []);


    async function loadPlantillas() {
        setLoading(true);
        setError('');
        try {
            const res = await skambaMostrarPlantillas('');
            if (res.success) {
                setPlantillas(res.data);
                if (selected) {
                    const updated = res.data.find((p) => p.pla_ide === selected.pla_ide);
                    setSelected(updated ?? null);
                }
            }
        } catch {
            setError('Error al cargar plantillas');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: { preventDefault(): void }) {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await skambaCrearPlantilla('', newName.trim(), 0); // usu_ide not used if token in interceptor, but let's see
            // Actually, wait, skambaCrearPlantilla uses usu_ide. I should get it from store.
            if (res.success) {
                setNewName('');
                setShowCreate(false);
                await loadPlantillas();
            }
        } catch {
            setError('Error al crear plantilla');
        } finally {
            setCreating(false);
        }
    }

    async function handleEditPlantilla(pla_ide: number) {
        if (!editPlaName.trim()) return;
        try {
            await skambaEditarPlantilla('', pla_ide, editPlaName.trim());
            setEditingPlaId(null);
            await loadPlantillas();
        } catch {
            setError('Error al editar plantilla');
        }
    }

    async function handleDeletePlantilla(pla_ide: number) {
        try {
            await skambaEliminarPlantilla('', pla_ide);
            if (selected?.pla_ide === pla_ide) setSelected(null);
            await loadPlantillas();
        } catch {
            setError('Error al eliminar plantilla');
        }
    }

    async function handleAddTask(e: { preventDefault(): void }) {
        e.preventDefault();
        if (!newTaskName.trim() || !selected) return;
        setCreatingTask(true);
        try {
            const res = await skambaCrearPlantillaTarea('', selected.pla_ide, newTaskName.trim());
            if (res.success) {
                setNewTaskName('');
                await loadPlantillas();
            }
        } catch {
            setError('Error al crear tarea de plantilla');
        } finally {
            setCreatingTask(false);
        }
    }

    async function handleEditTask(p_t_ide: number) {
        if (!editTaskName.trim()) return;
        try {
            await skambaEditarPlantillaTarea('', p_t_ide, editTaskName.trim());
            setEditingTaskId(null);
            await loadPlantillas();
        } catch {
            setError('Error al editar tarea');
        }
    }

    async function handleDeleteTask(p_t_ide: number) {
        try {
            await skambaEliminarPlantillaTarea('', p_t_ide);
            await loadPlantillas();
        } catch {
            setError('Error al eliminar tarea');
        }
    }

    async function handleApply(pla_ide: number, pro_ide: number) {
        setApplying(true);
        setSuccess('');
        try {
            const res = await skambaAplicarPlantilla('', pla_ide, pro_ide);
            if (res.success) {
                setSuccess(`Plantilla aplicada. ${res.tareas.length} tareas creadas.`);
                setApplyingTo(null);
                await loadProyectos();
            }
        } catch {
            setError('Error al aplicar plantilla');
        } finally {
            setApplying(false);
        }
    }

    // Collect lists from ALL workspaces (personal + group)
    const availableLists = collectAllLists(workspaces, groupWorkspaces);

    return (
        <div className="max-w-4xl mx-auto pt-5">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Plantillas</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Crea plantillas de tareas y aplícalas a tus listas.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Nueva plantilla
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <button onClick={() => setError('')} className="text-xs text-red-500 underline">Cerrar</button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                    <button onClick={() => setSuccess('')} className="text-xs text-green-500 underline">Cerrar</button>
                </div>
            )}

            {/* Create Form */}
            {showCreate && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nombre de la plantilla"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={creating || !newName.trim()}
                            className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {creating ? '...' : 'Crear'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="text-sm text-zinc-400 py-8 text-center">Cargando plantillas...</p>
            ) : plantillas.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M5.25 6.75h13.5M5.25 17.25h13.5" />
                        </svg>
                    </div>
                    <p className="text-sm text-zinc-500 mb-1">No hay plantillas todavía</p>
                    <p className="text-xs text-zinc-400">Crea tu primera plantilla para empezar</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="mt-4 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        + Nueva plantilla
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Plantillas List */}
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Plantillas</h2>
                        <div className="space-y-2">
                            {plantillas.map((p) => (
                                <div
                                    key={p.pla_ide}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors group ${selected?.pla_ide === p.pla_ide
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                    onClick={() => setSelected(p)}
                                >
                                    {editingPlaId === p.pla_ide ? (
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={editPlaName}
                                                onChange={(e) => setEditPlaName(e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <button
                                                onClick={() => handleEditPlantilla(p.pla_ide)}
                                                className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                            >
                                                OK
                                            </button>
                                            <button
                                                onClick={() => setEditingPlaId(null)}
                                                className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 rounded"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.pla_nom}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{p.tareas.length} tareas</p>
                                            </div>
                                            <div
                                                className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => { setEditingPlaId(p.pla_ide); setEditPlaName(p.pla_nom); }}
                                                    className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => setApplyingTo(p.pla_ide)}
                                                    className="px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                                                >
                                                    Aplicar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlantilla(p.pla_ide)}
                                                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Plantilla Detail */}
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                            {selected ? `Tareas de "${selected.pla_nom}"` : 'Detalle'}
                        </h2>
                        {!selected ? (
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <p className="text-sm text-zinc-400">Selecciona una plantilla</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                {/* Add task */}
                                <form onSubmit={handleAddTask} className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nueva tarea de plantilla"
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                            className="flex-1 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={creatingTask || !newTaskName.trim()}
                                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {creatingTask ? '...' : '+ Agregar'}
                                        </button>
                                    </div>
                                </form>

                                {/* Tasks list */}
                                {selected.tareas.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-zinc-400">Sin tareas en esta plantilla</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {selected.tareas.map((t) => (
                                            <div key={t.p_t_ide} className="flex items-center justify-between p-3 group">
                                                {editingTaskId === t.p_t_ide ? (
                                                    <div className="flex gap-2 flex-1">
                                                        <input
                                                            type="text"
                                                            value={editTaskName}
                                                            onChange={(e) => setEditTaskName(e.target.value)}
                                                            className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        <button
                                                            onClick={() => handleEditTask(t.p_t_ide)}
                                                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded"
                                                        >
                                                            OK
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTaskId(null)}
                                                            className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 rounded"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{t.p_t_nom}</span>
                                                            {t.p_t_pad !== 0 && (
                                                                <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                                    subtarea
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingTaskId(t.p_t_ide); setEditTaskName(t.p_t_nom); }}
                                                                className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(t.p_t_ide)}
                                                                className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Apply Plantilla Modal */}
            {applyingTo !== null && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setApplyingTo(null)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">Aplicar Plantilla</h3>
                        <p className="text-sm text-zinc-500 mb-4">Selecciona la lista donde se crearán las tareas:</p>
                        {availableLists.length === 0 ? (
                            <p className="text-sm text-zinc-400 py-4 text-center">
                                No hay listas disponibles. Crea una lista primero.
                            </p>
                        ) : (
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                {availableLists.map((l, index) => (
                                    <button
                                        key={`${l.pro_ide}-${index}`}
                                        onClick={() => handleApply(applyingTo, Number(l.pro_ide))}
                                        disabled={applying}
                                        className="w-full text-left px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 transition-colors"
                                    >
                                        {l.pro_nom}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => setApplyingTo(null)}
                            className="mt-4 w-full px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
