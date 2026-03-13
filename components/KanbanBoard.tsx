'use client';

import { useState, useEffect } from 'react';
import { Lista, Tarea, EstadoProyecto, skambaEditarTarea } from '../lib/api';
import { getProjectMembers } from '../lib/getProjectMembers';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskCreateModal } from './TaskCreateModal';

interface KanbanBoardProps {
    lista: Lista;
    onRefresh?: () => void;
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

const priorityColors: Record<string, string> = {
    '1': 'text-red-500',
    '2': 'text-amber-500',
    '3': 'text-emerald-500',
};

export function KanbanBoard({ lista, onRefresh }: KanbanBoardProps) {
    const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
    const [createEstadoId, setCreateEstadoId] = useState<string | null>(null);
    const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});

    useEffect(() => {
        getProjectMembers('', lista.pro_ide)
            .then(members => {
                const map: Record<string, string> = {};
                members.forEach(m => { map[String(m.usu_ide)] = m.usu_nom; });
                setUsuariosMap(map);
            })
            .catch(() => { });
    }, [lista.pro_ide]);

    const tareasPorEstado = (estado: EstadoProyecto): Tarea[] =>
        lista.tareas.filter((t) => t.tar_est === estado.p_e_ide);

    function handleTaskUpdated() {
        onRefresh?.();
        setSelectedTarea(null);
    }

    function handleTaskCreated() {
        setCreateEstadoId(null);
        onRefresh?.();
    }

    async function handleChangeEstado(tarea: Tarea, newEstadoId: string) {
        await skambaEditarTarea('', { tar_ide: Number(tarea.tar_ide), tar_est: Number(newEstadoId) });
        onRefresh?.();
    }

    return (
        <>
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{lista.pro_nom}</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {lista.estados.map((estado) => {
                        const tareas = tareasPorEstado(estado);

                        return (
                            <div
                                key={estado.p_e_ide}
                                className="flex flex-col gap-2 min-w-[14rem] w-56 shrink-0"
                            >
                                {/* Column header */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: estado.color ?? '#a1a1aa' }}
                                    />
                                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">
                                        {estado.est_nom}
                                    </span>
                                    <span className="ml-auto text-xs text-zinc-400">{tareas.length}</span>
                                </div>

                                {/* Cards */}
                                <div className="flex flex-col gap-2">
                                    {tareas.map((tarea) => {
                                        const { comments, files } = getTaskMetaCounts(tarea);
                                        const nombreAsignado = tarea.designado_nombre ?? (tarea.usu_des ? (usuariosMap[String(tarea.usu_des)] ?? String(tarea.usu_des)) : null);

                                        return (
                                            <button
                                                key={tarea.tar_ide}
                                                onClick={() => setSelectedTarea(tarea)}
                                                className="text-left bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                {/* Estado + título + prioridad */}
                                                <div className="flex items-start gap-2">
                                                    {/* Inline estado selector */}
                                                    <div
                                                        className="relative shrink-0 mt-0.75"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full block"
                                                            style={{ backgroundColor: lista.estados.find(e => String(e.p_e_ide) === String(tarea.tar_est))?.color ?? '#a1a1aa' }}
                                                            title={lista.estados.find(e => String(e.p_e_ide) === String(tarea.tar_est))?.est_nom}
                                                        />
                                                        <select
                                                            value={tarea.tar_est ?? ''}
                                                            onChange={async (e) => { await handleChangeEstado(tarea, e.target.value); }}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                        >
                                                            {lista.estados.map(est => (
                                                                <option key={est.p_e_ide} value={est.p_e_ide}>{est.est_nom}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <p className="text-sm text-zinc-800 dark:text-zinc-100 font-medium leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors flex-1">
                                                        {tarea.tar_nom}
                                                    </p>
                                                    {tarea.pri_ide && (
                                                        <span className={`inline-flex items-center shrink-0 ${priorityColors[tarea.pri_ide] ?? 'text-zinc-400'}`} title={`Prioridad ${tarea.pri_ide}`}>
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                <path d="M6 3h9.5a1 1 0 01.8.4l1.7 2.3a1 1 0 010 1.2l-1.7 2.3a1 1 0 01-.8.4H8v10a1 1 0 01-2 0V3z" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>

                                                {tarea.tar_des && (
                                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                                                        {stripHtml(tarea.tar_des)}
                                                    </p>
                                                )}

                                                {/* Footer: fecha + meta + asignado */}
                                                <div className="flex items-center justify-between mt-2 gap-2">
                                                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 min-w-0">
                                                        {tarea.tar_fch && (
                                                            <span className="inline-flex items-center gap-1 shrink-0">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {tarea.tar_fch}
                                                            </span>
                                                        )}
                                                        {comments > 0 && (
                                                            <span className="inline-flex items-center gap-1 shrink-0">
                                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m5 6-4-3H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4z" />
                                                                </svg>
                                                                {comments}
                                                            </span>
                                                        )}
                                                        {files > 0 && (
                                                            <span className="inline-flex items-center gap-1 shrink-0">
                                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05 12.05 20.4a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.2a2 2 0 0 1-2.83-2.83l8.48-8.48" />
                                                                </svg>
                                                                {files}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {nombreAsignado && (
                                                        <div className="flex items-center gap-1 shrink-0" title={nombreAsignado}>
                                                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-indigo-700 dark:text-indigo-300">
                                                                    {nombreAsignado.slice(0, 2).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {tareas.length === 0 && (
                                        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 px-3 py-4 text-center">
                                            <p className="text-xs text-zinc-400">Sin tareas</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add task button */}
                                <button
                                    onClick={() => setCreateEstadoId(estado.p_e_ide)}
                                    className="flex items-center gap-1.5 py-1.5 px-2 text-xs text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-900 rounded-md transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agregar tarea
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedTarea && (
                <TaskDetailModal
                    tarea={selectedTarea}
                    lista={lista}
                    onClose={() => setSelectedTarea(null)}
                    onUpdate={handleTaskUpdated}
                />
            )}

            {createEstadoId !== null && (
                <TaskCreateModal
                    lista={lista}
                    defaultEstadoId={createEstadoId}
                    onClose={() => setCreateEstadoId(null)}
                    onCreated={handleTaskCreated}
                />
            )}
        </>
    );
}
