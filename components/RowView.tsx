'use client';

import { useState, useEffect } from 'react';
import { Lista, Tarea, skambaCrearTarea, skambaEditarTarea, skambaEliminarTarea } from '../lib/api';
import type { Miembro } from '../lib/types/grupo';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskCreateModal } from './TaskCreateModal';
import { ProjectStatesModal } from './ProjectStatesModal';
import { Settings, Trash2 } from 'lucide-react';
import { useAuthStore } from '../context/useAuthStore';

interface RowViewProps {
    lista: Lista;
    onRefresh?: () => void;
    miembros?: Miembro[];
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
const toCount = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};
const getTaskMetaCounts = (tarea: Tarea) => {
    const raw = tarea as unknown as Record<string, unknown>;
    const comments = toCount(
        raw.com_cnt ?? raw.comentarios ?? raw.comentarios_count ?? raw.com_count ?? raw.tar_com,
    );
    const files = toCount(
        raw.arc_cnt ?? raw.archivos ?? raw.archivos_count ?? raw.arc_count ?? raw.tar_arc,
    );
    return { comments, files };
};

export function RowView({ lista, onRefresh, miembros = [] }: RowViewProps) {
    const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatesModal, setShowStatesModal] = useState(false);
    const [usuarios, setUsuarios] = useState<Miembro[]>(miembros);

    // Quick create state
    const [quickCreateStateId, setQuickCreateStateId] = useState<string | null>(null);
    const [quickTaskName, setQuickTaskName] = useState('');
    const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
    const [quickTaskDate, setQuickTaskDate] = useState('');
    const [quickTaskPriority, setQuickTaskPriority] = useState('');
    const [isCreatingQuick, setIsCreatingQuick] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        setUsuarios(miembros);
    }, [miembros]);

    const priorityStyles: Record<string, string> = {
        '1': 'text-red-600',
        '2': 'text-amber-600',
        '3': 'text-emerald-600',
    };

    function startQuickCreate(estadoId: string) {
        setQuickCreateStateId(estadoId);
        setQuickTaskName('');
        setQuickTaskAssignee('');
        setQuickTaskDate('');
        setQuickTaskPriority('');
    }

    async function handleQuickSubmit(estadoId: string) {
        if (!quickTaskName.trim()) return;

        setIsCreatingQuick(true);
        try {
            const res = await skambaCrearTarea('', {
                pro_ide: Number(lista.pro_ide),
                tar_nom: quickTaskName.trim(),
                tar_est: Number(estadoId),
                usu_des: quickTaskAssignee ? Number(quickTaskAssignee) : undefined,
                tar_fch: quickTaskDate || undefined,
                pri_ide: quickTaskPriority ? Number(quickTaskPriority) : undefined,
            });

            if (res.success) {
                onRefresh?.();
                // Keep input open to add more? Or close? let's reset name and keep open
                setQuickTaskName('');
                // If we want to close:
                // cancelQuickCreate();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreatingQuick(false);
        }
    }

    function handleTaskUpdated() {
        onRefresh?.();
        setSelectedTarea(null);
    }

    function handleTaskCreated() {
        setShowCreateModal(false);
        onRefresh?.();
    }

    async function handleDeleteTask(tarea: Tarea) {
        const usuIde = user?.usu_ide;
        if (!usuIde) return;
        if (!window.confirm(`¿Eliminar la tarea "${tarea.tar_nom}"?`)) return;

        try {
            const res = await skambaEliminarTarea('', Number(tarea.tar_ide), Number(usuIde));
            if (res.success) {
                if (selectedTarea?.tar_ide === tarea.tar_ide) setSelectedTarea(null);
                onRefresh?.();
            }
        } catch { }
    }

    const estadosOrdenados = [...lista.estados].sort(
        (a, b) => Number(a.est_ord) - Number(b.est_ord)
    );

    console.log(estadosOrdenados);

    // Group tasks by estado
    const grouped = estadosOrdenados.map((estado) => ({
        estado,
        tareas: lista.tareas.filter((t) => t.tar_est === estado.p_e_ide),
    }));



    return (
        <>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{lista.pro_nom}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStatesModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            title="Configurar estados del proyecto"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            Estados
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar tarea
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {grouped.map(({ estado, tareas }) => (
                        <div key={estado.p_e_ide} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            {/* Estado header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: estado.color ?? '#a1a1aa' }}
                                />
                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {estado.est_nom}
                                </span>
                                <span className="text-xs text-zinc-400">({tareas.length})</span>
                            </div>

                            {/* Table header */}
                            <div className="grid grid-cols-[28px_1fr_130px_140px_100px_72px] gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                                <span />
                                <span>Tarea</span>
                                <span>Asignado</span>
                                <span>Fecha</span>
                                <span className="text-right">Prioridad</span>
                                <span className="text-right">Acciones</span>
                            </div>

                            {/* Rows */}
                            {tareas.map((tarea) => {
                                const estadoColor = lista.estados.find(e => String(e.p_e_ide) === String(tarea.tar_est))?.color ?? '#a1a1aa';
                                const estadoNom = lista.estados.find(e => String(e.p_e_ide) === String(tarea.tar_est))?.est_nom;
                                const asignadoNom = tarea.designado_nombre ?? (tarea.usu_des ? (usuarios.find(u => String(u.usu_ide) === String(tarea.usu_des))?.usu_nom ?? String(tarea.usu_des)) : null);
                                const { comments, files } = getTaskMetaCounts(tarea);

                                return (
                                    <div
                                        key={tarea.tar_ide}
                                        className="w-full grid grid-cols-[28px_1fr_130px_140px_100px_72px] gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                                    >
                                        {/* Col 1: Estado — columna propia, área de clic grande */}
                                        <div className="relative flex items-center justify-center rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer" title={estadoNom}>
                                            <span
                                                className="w-3 h-3 rounded-full block shrink-0"
                                                style={{ backgroundColor: estadoColor }}
                                            />
                                            <select
                                                value={tarea.tar_est ?? ''}
                                                onChange={async (e) => {
                                                    await skambaEditarTarea('', { tar_ide: Number(tarea.tar_ide), tar_est: Number(e.target.value) });
                                                    onRefresh?.();
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            >
                                                {lista.estados.map(est => (
                                                    <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" key={est.p_e_ide} value={est.p_e_ide}>{est.est_nom}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Col 2: Título — único clic que abre el modal */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTarea(tarea)}
                                            className="min-w-0 text-left flex flex-col justify-center"
                                        >
                                            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium truncate hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">
                                                {tarea.tar_nom}
                                            </p>
                                            {tarea.tar_des && (
                                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                                    {stripHtml(tarea.tar_des)}
                                                </p>
                                            )}
                                            {(comments > 0 || files > 0) && (
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                                                    {comments > 0 && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m5 6-4-3H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4z" />
                                                            </svg>
                                                            {comments}
                                                        </span>
                                                    )}
                                                    {files > 0 && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05 12.05 20.4a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.2a2 2 0 0 1-2.83-2.83l8.48-8.48" />
                                                            </svg>
                                                            {files}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </button>

                                        {/* Col 3: Asignado — avatar visible + select overlay */}
                                        <div className="relative flex items-center rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer px-1">
                                            <div className="flex items-center gap-1.5 pointer-events-none min-w-0">
                                                {asignadoNom ? (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                                                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                                                                {asignadoNom.slice(0, 2).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{asignadoNom}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center shrink-0">
                                                            <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs text-zinc-300 dark:text-zinc-600">&mdash;</span>
                                                    </>
                                                )}
                                            </div>
                                            <select
                                                value={String(tarea.usu_des ?? '')}
                                                onChange={async (e) => {
                                                    await skambaEditarTarea('', {
                                                        tar_ide: Number(tarea.tar_ide),
                                                        usu_des: e.target.value ? Number(e.target.value) : undefined,
                                                    });
                                                    onRefresh?.();
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            >
                                                <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="">Sin asignar</option>
                                                {usuarios.map(u => (
                                                    <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" key={u.usu_ide} value={String(u.usu_ide)}>{u.usu_nom}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Col 4: Fecha — texto visible + date input overlay */}
                                        <div className="relative flex items-center rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer px-2">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 pointer-events-none">
                                                {tarea.tar_fch ?? <span className="text-zinc-300 dark:text-zinc-600">&mdash;</span>}
                                            </span>
                                            <input
                                                type="date"
                                                value={tarea.tar_fch ?? ''}
                                                onChange={async (e) => {
                                                    await skambaEditarTarea('', {
                                                        tar_ide: Number(tarea.tar_ide),
                                                        tar_fch: e.target.value || undefined,
                                                    });
                                                    onRefresh?.();
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </div>

                                        {/* Col 5: Prioridad — flag visible + select overlay */}
                                        <div className="relative flex items-center justify-end rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer px-1">
                                            {tarea.pri_ide ? (
                                                <span className={`inline-flex items-center gap-1 text-xs pointer-events-none ${priorityStyles[tarea.pri_ide] ?? 'text-zinc-400'}`}>
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                        <path d="M6 3h9.5a1 1 0 01.8.4l1.7 2.3a1 1 0 010 1.2l-1.7 2.3a1 1 0 01-.8.4H8v10a1 1 0 01-2 0V3z" />
                                                    </svg>
                                                    P{tarea.pri_ide}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-300 dark:text-zinc-600 pointer-events-none">&mdash;</span>
                                            )}
                                            <select
                                                value={tarea.pri_ide ?? ''}
                                                onChange={async (e) => {
                                                    await skambaEditarTarea('', {
                                                        tar_ide: Number(tarea.tar_ide),
                                                        pri_ide: e.target.value ? Number(e.target.value) : undefined,
                                                    });
                                                    onRefresh?.();
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            >
                                                <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="">Sin prioridad</option>
                                                <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="1">Alta</option>
                                                <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="2">Media</option>
                                                <option className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800" value="3">Baja</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteTask(tarea)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Eliminar tarea"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {tareas.length === 0 && quickCreateStateId !== String(estado.p_e_ide) && (
                                <div className="px-4 py-3">
                                    <p className="text-xs text-zinc-400 italic">Sin tareas en este estado</p>
                                </div>
                            )}

                            {quickCreateStateId === String(estado.p_e_ide) ? (
                                <div className="px-3 py-2 border-t border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/40 dark:bg-indigo-900/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Título de la tarea..."
                                            className="flex-1 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-400"
                                            value={quickTaskName}
                                            onChange={(e) => setQuickTaskName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && quickCreateStateId) handleQuickSubmit(quickCreateStateId);
                                                if (e.key === 'Escape') setQuickCreateStateId(null);
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            {/* Assignee Select */}
                                            <div className="relative">
                                                <select
                                                    className="appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none focus:border-indigo-500 pr-6"
                                                    value={quickTaskAssignee}
                                                    onChange={(e) => setQuickTaskAssignee(e.target.value)}
                                                >
                                                    <option value="">Sin asignar</option>
                                                    {usuarios.map(u => (
                                                        <option key={u.usu_ide} value={u.usu_ide}>{u.usu_nom}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-zinc-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>

                                            {/* Date Input */}
                                            <input
                                                type="date"
                                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none focus:border-indigo-500"
                                                value={quickTaskDate}
                                                onChange={(e) => setQuickTaskDate(e.target.value)}
                                            />

                                            {/* Priority Select */}
                                            <div className="relative">
                                                <select
                                                    className="appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none focus:border-indigo-500 pr-6"
                                                    value={quickTaskPriority}
                                                    onChange={(e) => setQuickTaskPriority(e.target.value)}
                                                >
                                                    <option value="">Prioridad</option>
                                                    <option value="1">Baja</option>
                                                    <option value="2">Media</option>
                                                    <option value="3">Alta</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-zinc-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setQuickCreateStateId(null)}
                                                className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => quickCreateStateId && handleQuickSubmit(quickCreateStateId)}
                                                disabled={!quickTaskName.trim() || isCreatingQuick}
                                                className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                {isCreatingQuick ? 'Creando...' : 'Crear'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => startQuickCreate(String(estado.p_e_ide))}
                                    className="w-full text-left px-4 py-3 text-xs text-zinc-400 hover:text-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-2 transition-colors border-t border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Añadir tarea
                                </button>
                            )}

                        </div>
                    ))}
                </div>
            </div>

            {selectedTarea && (
                <TaskDetailModal
                    tarea={selectedTarea}
                    lista={lista}
                    onClose={() => setSelectedTarea(null)}
                    onUpdate={handleTaskUpdated}
                    miembros={usuarios}
                />
            )}

            {showCreateModal && (
                <TaskCreateModal
                    lista={lista}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleTaskCreated}
                    miembros={usuarios}
                />
            )}
            {showStatesModal && (
                <ProjectStatesModal
                    proId={lista.pro_ide}
                    onClose={() => setShowStatesModal(false)}
                    onUpdate={onRefresh}
                />
            )}
        </>
    );
}
