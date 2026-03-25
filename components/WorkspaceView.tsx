'use client';

import { useState, useEffect } from 'react';
import {
    Workspace,
    Lista,
    Tarea,
    Miembro,
} from '../lib/api';
import { useAuthStore } from '../context/useAuthStore';
import { useDashboard } from '../context/DashboardContext';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskCreateModal } from './TaskCreateModal';

interface WorkspaceViewProps {
    workspace: Workspace;
    onSelectList: (lista: Lista) => void;
}

type StatusCategory = 'inprogress' | 'pending' | 'completed' | 'other';

interface TaskRow {
    tar_ide: string;
    tar_nom: string;
    tarea: Tarea;
    listaNom: string;
    listaPath: string;
    lista: Lista;
    statusName: string;
    statusColor: string;
    cat: StatusCategory;
}

function categorizeName(name: string): StatusCategory {
    const n = name.toLowerCase();
    if (n.includes('proceso') || n.includes('progreso')) return 'inprogress';
    if (n.includes('pendiente')) return 'pending';
    if (n.includes('complet') || n.includes('finaliz') || n.includes('cerrad')) return 'completed';
    return 'other';
}

export function WorkspaceView({ workspace, onSelectList }: WorkspaceViewProps) {
    const { loadProyectos } = useDashboard();
    const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
    const [createListaId, setCreateListaId] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const spaces = workspace.spaces;
    const folders = spaces.flatMap((s) => s.contenido?.folders ?? []);

    // Flatten all lists with breadcrumb path
    const listsWithPaths: Array<Lista & { path: string }> = [];
    spaces.forEach((space) => {
        (space.contenido?.listas ?? []).forEach((lista) =>
            listsWithPaths.push({ ...lista, path: space.pro_nom }),
        );
        (space.contenido?.folders ?? []).forEach((folder) =>
            folder.listas.forEach((lista) =>
                listsWithPaths.push({ ...lista, path: `${space.pro_nom} › ${folder.pro_nom}` }),
            ),
        );
    });

    // Build flat task rows categorized by individual task status
    const taskRows: TaskRow[] = listsWithPaths.flatMap((lista) =>
        lista.tareas.map((t) => {
            const estado = lista.estados.find((e) => e.p_e_ide === t.tar_est);
            const statusName = estado?.est_nom ?? 'Sin estado';
            const statusColor = estado?.color ?? '#a1a1aa';
            return {
                tar_ide: t.tar_ide,
                tar_nom: t.tar_nom,
                tarea: t,
                listaNom: lista.pro_nom,
                listaPath: lista.path,
                lista,
                statusName,
                statusColor,
                cat: categorizeName(statusName),
            };
        }),
    );

    const totalTasks = taskRows.length;
    const totalLists = listsWithPaths.length;

    const inProgressTasks = taskRows.filter((t) => t.cat === 'inprogress');
    const pendingTasks = taskRows.filter((t) => t.cat === 'pending');
    const completedTasks = taskRows.filter((t) => t.cat === 'completed');
    const otherTasks = taskRows.filter((t) => t.cat === 'other');

    // --- Members panel state ---
    // Collect members from all listas in the workspace (deduplicated by p_m_ide or usu_ide)
    const miembros: Miembro[] = listsWithPaths.reduce((acc: Miembro[], lista) => {
        if (lista.miembros && lista.miembros.length > 0) {
            lista.miembros.forEach(m => {
                // Deduplicar por p_m_ide si existe, sino por usu_ide
                const existingIndex = acc.findIndex(existing =>
                    (m.p_m_ide && existing.p_m_ide === m.p_m_ide) ||
                    (!m.p_m_ide && existing.usu_ide === m.usu_ide)
                );
                if (existingIndex === -1) {
                    acc.push(m);
                }
            });
        }
        return acc;
    }, []);

    const [addError, setAddError] = useState('');
    const { user: storeUser } = useAuthStore();

    return (
        <div className="flex h-full overflow-hidden">
            {/* ── Left: task list ── */}
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                        {workspace.pro_nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                            {workspace.pro_nom}
                        </h1>
                        <p className="text-[11px] text-zinc-400">
                            {folders.length} carpeta{folders.length !== 1 ? 's' : ''} &middot;{' '}
                            {totalLists} lista{totalLists !== 1 ? 's' : ''} &middot;{' '}
                            {totalTasks} tarea{totalTasks !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {/* Summary pills */}
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        {inProgressTasks.length > 0 && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                {inProgressTasks.length} en proceso
                            </span>
                        )}
                        {pendingTasks.length > 0 && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                {pendingTasks.length} pendiente{pendingTasks.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {listsWithPaths.length > 0 && (
                            <>
                                <select
                                    value={createListaId}
                                    onChange={(e) => setCreateListaId(e.target.value)}
                                    className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Lista...</option>
                                    {listsWithPaths.map((l) => (
                                        <option key={l.pro_ide} value={l.pro_ide}>
                                            {l.path ? `${l.path} › ${l.pro_nom}` : l.pro_nom}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    disabled={!createListaId}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nueva tarea
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Task rows */}
                {totalTasks === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-12 h-12 mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-sm text-zinc-500">Sin tareas en este workspace</p>
                        <p className="text-xs text-zinc-400 mt-1">Crea listas y tareas desde el menú lateral</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        <TaskGroup
                            label="En Proceso"
                            dotColor="bg-orange-500"
                            tasks={inProgressTasks}
                            onSelectList={onSelectList}
                            onSelectTask={setSelectedTask}
                            defaultOpen
                        />
                        <TaskGroup
                            label="Pendientes"
                            dotColor="bg-red-500"
                            tasks={pendingTasks}
                            onSelectList={onSelectList}
                            onSelectTask={setSelectedTask}
                            defaultOpen
                        />
                        <TaskGroup
                            label="Completadas"
                            dotColor="bg-green-500"
                            tasks={completedTasks}
                            onSelectList={onSelectList}
                            onSelectTask={setSelectedTask}
                            defaultOpen={false}
                        />
                        <TaskGroup
                            label="Otras"
                            dotColor="bg-zinc-400"
                            tasks={otherTasks}
                            onSelectList={onSelectList}
                            onSelectTask={setSelectedTask}
                            defaultOpen={false}
                        />
                    </div>
                )}
            </div>

            {/* ── Task detail modal ── */}
            {selectedTask && (
                <TaskDetailModal
                    tarea={selectedTask.tarea}
                    lista={selectedTask.lista}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={() => { loadProyectos(); setSelectedTask(null); }}
                />
            )}

            {/* ── Task create modal ── */}
            {showCreateModal && (() => {
                const lista = listsWithPaths.find((l) => String(l.pro_ide) === String(createListaId));
                if (!lista) return null;
                return (
                    <TaskCreateModal
                        lista={lista}
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => { setShowCreateModal(false); setCreateListaId(''); loadProyectos(); }}
                    />
                );
            })()}

            {/* ── Right: Members panel ── */}
            <div className="w-64 shrink-0 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Miembros
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {miembros.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-4">
                            Sin miembros en este proyecto.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {miembros.map((m) => (
                                <div
                                    key={m.usu_ide}
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold shrink-0">
                                        {m.usu_nom.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                            {m.usu_nom}
                                        </p>
                                        {m.usu_ema && (
                                            <p className="text-[10px] text-zinc-400 truncate">
                                                {m.usu_ema}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── TaskGroup: collapsible section of task rows ──────────────────────────────

function TaskGroup({
    label,
    dotColor,
    tasks,
    onSelectList,
    onSelectTask,
    defaultOpen,
}: {
    label: string;
    dotColor: string;
    tasks: TaskRow[];
    onSelectList: (lista: Lista) => void;
    onSelectTask: (row: TaskRow) => void;
    defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    if (tasks.length === 0) return null;

    return (
        <div>
            {/* Section header */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-6 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex-1">
                    {label}
                </span>
                <span className="text-[11px] text-zinc-400 mr-2">{tasks.length}</span>
                <svg
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Rows */}
            {open && (
                <div className="bg-white dark:bg-zinc-900/20">
                    {/* Column headers */}
                    <div className="flex items-center gap-3 px-6 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                        <span className="flex-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                            Tarea
                        </span>
                        <span className="w-40 shrink-0 text-[10px] font-medium text-zinc-400 uppercase tracking-wider hidden sm:block">
                            Lista
                        </span>
                        <span className="w-28 shrink-0 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                            Estado
                        </span>
                    </div>

                    {tasks.map((t) => (
                        <div
                            key={t.tar_ide}
                            onClick={() => onSelectTask(t)}
                            className="flex items-center gap-3 px-6 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-50 dark:border-zinc-800/30 last:border-0 cursor-pointer"
                        >
                            {/* Task name */}
                            <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 truncate min-w-0">
                                {t.tar_nom}
                            </p>

                            {/* List link */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onSelectList(t.lista); }}
                                className="w-40 shrink-0 text-left hidden sm:block"
                                title={`${t.listaPath} › ${t.listaNom}`}
                            >
                                <span className="block text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 truncate transition-colors">
                                    {t.listaNom}
                                </span>
                                {t.listaPath && (
                                    <span className="block text-[10px] text-zinc-400 truncate">
                                        {t.listaPath}
                                    </span>
                                )}
                            </button>

                            {/* Status badge */}
                            <span
                                className="w-28 shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full truncate"
                                style={{
                                    backgroundColor: `${t.statusColor}20`,
                                    color: t.statusColor,
                                }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: t.statusColor }}
                                />
                                <span className="truncate">{t.statusName}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
