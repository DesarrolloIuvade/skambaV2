'use client';

import { Lista, skambaConseguirEstadosProyecto, skambaVerTareas, Tarea, type EstadoProyecto } from '../lib/api';
import { KanbanBoard } from './KanbanBoard';
import { RowView } from './RowView';
import { useDashboard } from '../context/DashboardContext';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { emitTasksUpdated, TASKS_UPDATED_EVENT, type TasksUpdatedDetail } from '../lib/task-events';

interface ListViewProps {
    lista: Lista;
    onRefresh?: () => void | Promise<void>;
}

import type { Miembro } from '../lib/api';

function normalizeStateName(value?: string | null) {
    return String(value ?? '').trim().toLowerCase();
}

function isPendingTask(
    tarea: Partial<Tarea> & { est_nom?: string | null },
    estados: EstadoProyecto[],
) {
    const statusName =
        tarea.est_nom ??
        estados.find((item) => String(item.p_e_ide) === String(tarea.tar_est))?.est_nom ??
        '';

    return normalizeStateName(statusName).includes('pendiente');
}

function normalizeListTask(
    tarea: Partial<Tarea> & { est_nom?: string | null },
    lista: Lista,
    estados: EstadoProyecto[],
): Tarea {
    const taskStateName = normalizeStateName(tarea.est_nom);
    const estado = tarea.tar_est
        ? estados.find((item) => String(item.p_e_ide) === String(tarea.tar_est))
        : estados.find((item) => normalizeStateName(item.est_nom) === taskStateName);

    return {
        tar_ide: String(tarea.tar_ide ?? ''),
        pro_ide: String(tarea.pro_ide ?? lista.pro_ide),
        tar_nom: String(tarea.tar_nom ?? ''),
        tar_des: String(tarea.tar_des ?? ''),
        usu_des: tarea.usu_des != null ? String(tarea.usu_des) : null,
        tar_gen: String(tarea.tar_gen ?? ''),
        tar_fch: tarea.tar_fch ? String(tarea.tar_fch) : null,
        pri_ide: tarea.pri_ide != null ? String(tarea.pri_ide) : null,
        est_ado: String(tarea.est_ado ?? '1'),
        tar_est: String(estado?.p_e_ide ?? tarea.tar_est ?? ''),
        p_t_ide: tarea.p_t_ide != null ? String(tarea.p_t_ide) : null,
        tar_pad: tarea.tar_pad != null ? String(tarea.tar_pad) : null,
        com_cnt: tarea.com_cnt,
        arc_cnt: tarea.arc_cnt,
        designado_nombre: tarea.designado_nombre ?? null,
        creador_nombre: tarea.creador_nombre ?? null,
    };
}

export function ListView({ lista }: ListViewProps) {
    const { viewMode, setMiembros: setContextMiembros } = useDashboard();
    const [tasks, setTasks] = useState<Tarea[]>(lista.tareas || []);
    const [miembros, setMiembros] = useState<Miembro[]>(lista.miembros || []);
    const [estados, setEstados] = useState<EstadoProyecto[]>(lista.estados || []);
    const [loading, setLoading] = useState(false);
    const listaRef = useRef(lista);
    const estadosRef = useRef<{ proIde: string; estados: EstadoProyecto[] }>({
        proIde: String(lista.pro_ide),
        estados: lista.estados || [],
    });
    const setContextMiembrosRef = useRef(setContextMiembros);
    const fetchSeqRef = useRef(0);

    useEffect(() => {
        listaRef.current = lista;
    }, [lista]);

    useEffect(() => {
        setContextMiembrosRef.current = setContextMiembros;
    }, [setContextMiembros]);

    async function ensureEstados(): Promise<EstadoProyecto[]> {
        const currentLista = listaRef.current;
        const currentListId = String(currentLista.pro_ide);
        const currentEstados =
            estadosRef.current.proIde === currentListId ? estadosRef.current.estados : [];

        if ((currentEstados?.length ?? 0) > 0) return currentEstados;
        if ((currentLista.estados?.length ?? 0) > 0) {
            setEstados(currentLista.estados);
            estadosRef.current = {
                proIde: currentListId,
                estados: currentLista.estados,
            };
            return currentLista.estados;
        }

        try {
            const response = await skambaConseguirEstadosProyecto('', Number(currentListId));
            const nextEstados = Array.isArray(response) ? response : [];
            if (String(listaRef.current.pro_ide) === currentListId) {
                setEstados(nextEstados);
                estadosRef.current = {
                    proIde: currentListId,
                    estados: nextEstados,
                };
            }
            return nextEstados;
        } catch {
            return [];
        }
    }

    async function fetchTasks(showLoader = true) {
        const currentLista = listaRef.current;
        const currentListId = String(currentLista.pro_ide);
        const fetchSeq = ++fetchSeqRef.current;
        if (showLoader) setLoading(true);
        try {
            const resolvedEstados = await ensureEstados();
            const res = await skambaVerTareas('', Number(currentListId));
            const isStale =
                fetchSeq !== fetchSeqRef.current ||
                String(listaRef.current.pro_ide) !== currentListId;

            if (res.success && !isStale) {
                const mappedTasks = res.data.map((tarea: Tarea & { est_nom?: string }) =>
                    normalizeListTask(tarea, currentLista, resolvedEstados),
                );
                const pendingCount = res.data.filter((tarea: Tarea & { est_nom?: string }) =>
                    isPendingTask(tarea, resolvedEstados),
                ).length;
                setTasks(mappedTasks);
                const m = (res.miembros && res.miembros.length > 0) ? res.miembros : (currentLista.miembros || []);
                setMiembros(m);
                setContextMiembrosRef.current(m);
                return { tasks: mappedTasks, pendingCount };
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            if (
                showLoader &&
                fetchSeq === fetchSeqRef.current &&
                String(listaRef.current.pro_ide) === currentListId
            ) {
                setLoading(false);
            }
        }

        return null;
    }

    useEffect(() => {
        const nextTasks = lista.tareas || [];
        const nextMembers = lista.miembros || [];
        const nextEstados = lista.estados || [];

        setTasks(nextTasks);
        setMiembros(nextMembers);
        setContextMiembros(nextMembers);
        setEstados(nextEstados);
        estadosRef.current = {
            proIde: String(lista.pro_ide),
            estados: nextEstados,
        };
    }, [lista.pro_ide, lista.tareas, lista.miembros, lista.estados, setContextMiembros]);

    useEffect(() => {
        void fetchTasks();
    }, [lista.pro_ide]);

    useEffect(() => {
        function handleTasksUpdated(event: Event) {
            const customEvent = event as CustomEvent<TasksUpdatedDetail>;
            if (String(customEvent.detail?.proIde ?? '') !== String(lista.pro_ide)) return;
            if (customEvent.detail?.source === 'list-view') return;
            void fetchTasks(false);
        }

        window.addEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated as EventListener);
        return () => {
            window.removeEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated as EventListener);
        };
    }, [lista.pro_ide]);

    const handleRefresh = async () => {
        const result = await fetchTasks(false);
        emitTasksUpdated({
            proIde: String(lista.pro_ide),
            source: 'list-view',
            pendingCount: result?.pendingCount,
        });
    };

    const updatedLista = { ...lista, tareas: tasks, estados, miembros };

    return (
        <div className="p-6 h-full flex flex-col relative">
            {loading && tasks.length === 0 && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            )}
            {/* View content */}
            <div className="flex-1 min-h-0 overflow-auto">
                {viewMode === 'rows' ? (
                    <RowView lista={updatedLista} onRefresh={handleRefresh} miembros={miembros} />
                ) : (
                    <KanbanBoard lista={updatedLista} onRefresh={handleRefresh} miembros={miembros} />
                )}
            </div>
        </div>
    );
}
