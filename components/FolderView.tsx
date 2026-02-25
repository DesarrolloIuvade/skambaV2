'use client';

import { useState } from 'react';
import { Folder, Lista } from '../lib/api';
import { TaskCreateModal } from './TaskCreateModal';
import { useDashboard } from '../context/DashboardContext';

interface FolderViewProps {
    folder: Folder;
    onSelectList: (lista: Lista) => void;
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' });
    } catch {
        return null;
    }
}

export function ListSection({ lista, onSelectList }: { lista: Lista; onSelectList: () => void }) {
    const [isOpen, setIsOpen] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { loadProyectos } = useDashboard();

    // Group tasks by status, only statuses that have tasks
    const statusesWithTasks = lista.estados.filter(
        e => lista.tareas.some(t => String(t.tar_est) === String(e.p_e_ide))
    );

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* List header */}
            <div className="flex items-center gap-2 px-4 py-3">
                <button
                    onClick={() => setIsOpen(v => !v)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                    <svg
                        className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{lista.pro_nom}</span>
                    <span className="ml-1 text-xs text-zinc-400 shrink-0">
                        {lista.tareas.length} tarea{lista.tareas.length !== 1 ? 's' : ''}
                    </span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                    className="shrink-0 p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title="Nueva tarea"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <button
                    onClick={onSelectList}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                    Abrir →
                </button>
            </div>

            {showCreateModal && (
                <TaskCreateModal
                    lista={lista}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); loadProyectos(); }}
                />
            )}

            {/* Tasks by status */}
            {isOpen && (
                <div className="border-t border-zinc-100 dark:border-zinc-800">
                    {lista.tareas.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-zinc-400 italic">Sin tareas</p>
                    ) : (
                        statusesWithTasks.map(estado => {
                            const tasks = lista.tareas.filter(
                                t => String(t.tar_est) === String(estado.p_e_ide)
                            );
                            return (
                                <div key={estado.p_e_ide}>
                                    {/* Status header */}
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800/50">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: estado.color ?? '#a1a1aa' }}
                                        />
                                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                            {estado.est_nom}
                                        </span>
                                        <span className="ml-auto text-[11px] text-zinc-400 tabular-nums">{tasks.length}</span>
                                    </div>

                                    {/* Task rows */}
                                    {tasks.map(task => {
                                        const fechaStr = formatDate(task.tar_fch);
                                        const assignee = task.usu_des ? String(task.usu_des) : null;
                                        return (
                                            <div
                                                key={task.tar_ide}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: estado.color ?? '#a1a1aa' }}
                                                />
                                                <span className="text-sm text-zinc-800 dark:text-zinc-200 flex-1 truncate">
                                                    {task.tar_nom}
                                                </span>
                                                {fechaStr && (
                                                    <span className="text-[11px] text-zinc-400 shrink-0">{fechaStr}</span>
                                                )}
                                                {assignee ? (
                                                    <div
                                                        className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0"
                                                        title={`Asignado a: ${assignee}`}
                                                    >
                                                        {assignee.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-5 h-5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 shrink-0"
                                                        title="Sin asignar"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export function FolderView({ folder, onSelectList }: FolderViewProps) {
    const totalTasks = folder.listas.reduce((a, l) => a + l.tareas.length, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-zinc-900 dark:text-white">{folder.pro_nom}</h1>
                        <p className="text-xs text-zinc-400">
                            {folder.listas.length} lista{folder.listas.length !== 1 ? 's' : ''} &middot;{' '}
                            {totalTasks} tarea{totalTasks !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {folder.listas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-zinc-500">Esta carpeta no tiene listas aún</p>
                        <p className="text-xs text-zinc-400 mt-1">Crea una lista desde el menú lateral</p>
                    </div>
                ) : (
                    folder.listas.map(lista => (
                        <ListSection
                            key={lista.pro_ide}
                            lista={lista}
                            onSelectList={() => onSelectList(lista)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
