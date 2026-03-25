'use client';

import { Lista, skambaVerTareas, Tarea } from '../lib/api';
import { KanbanBoard } from './KanbanBoard';
import { RowView } from './RowView';
import { useDashboard } from '../context/DashboardContext';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ListViewProps {
    lista: Lista;
    onRefresh?: () => void;
}

import type { Miembro } from '../lib/api';

export function ListView({ lista, onRefresh }: ListViewProps) {
    const { viewMode, setMiembros: setContextMiembros } = useDashboard();
    const [tasks, setTasks] = useState<Tarea[]>(lista.tareas || []);
    const [miembros, setMiembros] = useState<Miembro[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const res = await skambaVerTareas('', Number(lista.pro_ide));
                if (res.success) {
                    // Map the response data to ensure tar_est is set from est_nom
                    const mappedTasks = res.data.map((tarea: any) => {
                        if (!tarea.tar_est && tarea.est_nom) {
                            // Find the estado ID based on est_nom
                            const estado = lista.estados.find(e => e.est_nom === tarea.est_nom);
                            return {
                                ...tarea,
                                tar_est: estado?.p_e_ide || tarea.tar_est,
                            };
                        }
                        return tarea;
                    });
                    setTasks(mappedTasks);
                    const m = res.miembros || [];
                    setMiembros(m);
                    setContextMiembros(m);
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [lista.pro_ide, lista.estados, setContextMiembros]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const res = await skambaVerTareas('', Number(lista.pro_ide));
            if (res.success) {
                // Map the response data to ensure tar_est is set from est_nom
                const mappedTasks = res.data.map((tarea: any) => {
                    if (!tarea.tar_est && tarea.est_nom) {
                        // Find the estado ID based on est_nom
                        const estado = lista.estados.find(e => e.est_nom === tarea.est_nom);
                        return {
                            ...tarea,
                            tar_est: estado?.p_e_ide || tarea.tar_est,
                        };
                    }
                    return tarea;
                });
                setTasks(mappedTasks);
                const m = res.miembros || [];
                setMiembros(m);
                setContextMiembros(m);
            }
        } finally {
            setLoading(false);
        }
        onRefresh?.();
    };

    const updatedLista = { ...lista, tareas: tasks };

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
