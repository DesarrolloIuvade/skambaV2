'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useAuthStore } from '../context/useAuthStore';
import {
    skambaBuscarTareas,
    skambaConseguirProyecto,
    skambaVerTarea,
    type EstadoProyecto,
    type Lista,
    type Tarea,
    type TareaBusquedaGlobal,
} from '../lib/api';
import { TaskDetailModal } from './TaskDetailModal';

function stripHtml(html?: string | null) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function resolveEstadoId(
    task: Partial<TareaBusquedaGlobal>,
    estados: EstadoProyecto[],
) {
    const byProjectStateId = task.tar_est ? String(task.tar_est) : '';
    if (byProjectStateId && estados.some((estado) => String(estado.p_e_ide) === byProjectStateId)) {
        return byProjectStateId;
    }

    const byBaseStateId = task.est_ide ? String(task.est_ide) : '';
    if (byBaseStateId) {
        const match = estados.find((estado) => String(estado.est_ide) === byBaseStateId);
        if (match) return String(match.p_e_ide);
    }

    const byName = task.est_nom?.trim().toLowerCase();
    if (byName) {
        const match = estados.find((estado) => estado.est_nom.trim().toLowerCase() === byName);
        if (match) return String(match.p_e_ide);
    }

    return String(estados[0]?.p_e_ide ?? '');
}

export function DashboardHeader() {
    const { user, logout, selectedView, loadProyectos, selectLista } = useDashboard();
    const { token } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [remoteResults, setRemoteResults] = useState<TareaBusquedaGlobal[]>([]);
    const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
    const [selectedTaskList, setSelectedTaskList] = useState<Lista | null>(null);
    const [openingTaskId, setOpeningTaskId] = useState<string | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const selectedList = selectedView?.type === 'list' ? selectedView.lista : null;
    const effectiveQuery = submittedQuery.trim();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (profileRef.current && !profileRef.current.contains(target)) {
                setOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(target)) {
                setSearchOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase();

    async function runSearch() {
        const trimmedQuery = searchQuery.trim();
        setSubmittedQuery(trimmedQuery);
        setSearchOpen(true);

        if (trimmedQuery.length < 2) {
            setRemoteResults([]);
            setSearchError('');
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        setSearchError('');
        try {
            const response = await skambaBuscarTareas('', {
                q: trimmedQuery,
                page: 1,
                limit: 20,
            });

            if (!response.success) {
                setRemoteResults([]);
                setSearchError(response.message || 'No se pudo completar la búsqueda');
                return;
            }

            setRemoteResults(response.data ?? []);
        } catch (error) {
            setRemoteResults([]);
            setSearchError(error instanceof Error ? error.message : 'Error inesperado al buscar tareas');
        } finally {
            setSearchLoading(false);
        }
    }

    async function openTaskFromList(task: TareaBusquedaGlobal, lista: Lista) {
        const resolvedTask = lista.tareas.find(
            (item) => String(item.tar_ide) === String(task.tar_ide),
        );

        selectLista(lista);
        setSelectedTask(
            resolvedTask ?? {
                ...task,
                tar_est: resolveEstadoId(task, lista.estados),
            },
        );
        setSelectedTaskList(lista);
        setSearchOpen(false);
    }

    async function handleSelectTask(task: TareaBusquedaGlobal) {
        if (openingTaskId === String(task.tar_ide)) return;

        const listId = String(task.pro_ide ?? task.lista?.pro_ide ?? '');
        if (!listId) return;

        if (selectedList && String(selectedList.pro_ide) === listId) {
            await openTaskFromList(task, selectedList);
            return;
        }

        setOpeningTaskId(String(task.tar_ide));
        try {
            const listResponse = await skambaConseguirProyecto(token ?? '', Number(listId));
            if (listResponse.success && listResponse.data && 'tareas' in listResponse.data) {
                await openTaskFromList(task, listResponse.data as Lista);
                return;
            }

            const taskResponse = await skambaVerTarea('', Number(task.tar_ide), Number(listId));
            if (!taskResponse.success || !taskResponse.data) return;

            const resolvedTask = taskResponse.data;
            const estados = taskResponse.estados ?? [];
            const miembros = taskResponse.miembros ?? [];
            const syntheticList: Lista = {
                pro_ide: listId,
                pro_nom: task.lista?.pro_nom ?? task.pro_nom ?? 'Lista',
                usu_ide: '0',
                pro_pad: String(task.lista?.pro_pad ?? '0'),
                est_ado: '1',
                pro_tip: 'list',
                tareas: [resolvedTask],
                estados,
                miembros,
            };

            selectLista(syntheticList);
            setSelectedTask({
                ...resolvedTask,
                tar_est: resolveEstadoId(resolvedTask, estados),
            });
            setSelectedTaskList(syntheticList);
            setSearchOpen(false);
        } finally {
            setOpeningTaskId(null);
        }
    }

    return (
        <>
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
                <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight shrink-0">Skamba</span>

                <div className="flex-1 max-w-2xl" ref={searchRef}>
                    <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setSearchError('');
                                    setSearchOpen(true);
                                }}
                                onFocus={() => setSearchOpen(true)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void runSearch();
                                    }
                                }}
                                placeholder="Buscar tareas en todos tus proyectos"
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                            />
                        </div>
                        <button
                            onClick={() => void runSearch()}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            Buscar
                        </button>
                    </div>

                    {searchOpen && (
                        <div className="absolute z-50 mt-2 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-medium text-zinc-500">
                                Pulsa Enter para buscar en todos tus proyectos
                            </div>

                            {effectiveQuery.length < 2 ? (
                                <div className="px-4 py-6 text-sm text-zinc-500">
                                    Escribe al menos 2 caracteres y presiona Enter.
                                </div>
                            ) : searchLoading ? (
                                <div className="px-4 py-6 flex items-center gap-2 text-sm text-zinc-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Buscando tareas...
                                </div>
                            ) : searchError ? (
                                <div className="px-4 py-6 text-sm text-red-500">{searchError}</div>
                            ) : remoteResults.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-zinc-500">
                                    No encontramos tareas para &quot;{effectiveQuery}&quot;.
                                </div>
                            ) : (
                                <div className="max-h-[26rem] overflow-y-auto">
                                    {remoteResults.map((task) => {
                                        const listName = task.lista?.pro_nom ?? task.pro_nom ?? 'Sin lista';
                                        const opening = openingTaskId === String(task.tar_ide);
                                        const summary = stripHtml(task.tar_des);

                                        return (
                                            <button
                                                key={task.tar_ide}
                                                onClick={() => void handleSelectTask(task)}
                                                className="w-full px-4 py-3 text-left border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                                {task.tar_nom}
                                                            </p>
                                                            {opening && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />}
                                                        </div>
                                                        <p className="mt-1 line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                            {summary || 'Sin descripción'}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                                                            <span>Lista: {listName}</span>
                                                            <span>Tarea #{task.tar_ide}</span>
                                                            <span>Proyecto #{task.pro_ide}</span>
                                                            {task.est_nom && <span>Estado: {task.est_nom}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative shrink-0" ref={profileRef}>
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                    >
                        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {initial}
                        </div>
                        <div className="text-left hidden sm:block">
                            {user?.name && (
                                <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">{user.name}</p>
                            )}
                            <p className="text-[11px] text-zinc-400 leading-none mt-0.5">{user?.email}</p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        {user?.name && (
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        )}
                                        <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-1">
                                <button
                                    onClick={() => { setOpen(false); logout(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {selectedTask && selectedTaskList && (
                <TaskDetailModal
                    tarea={selectedTask}
                    lista={selectedTaskList}
                    miembros={selectedTaskList.miembros ?? []}
                    onClose={() => {
                        setSelectedTask(null);
                        setSelectedTaskList(null);
                    }}
                    onUpdate={() => {
                        loadProyectos();
                        setSelectedTask(null);
                        setSelectedTaskList(null);
                    }}
                />
            )}
        </>
    );
}
