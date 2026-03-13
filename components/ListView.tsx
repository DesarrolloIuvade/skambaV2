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

export function ListView({ lista, onRefresh }: ListViewProps) {
    const { viewMode } = useDashboard();
    const [tasks, setTasks] = useState<Tarea[]>(lista.tareas || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const res = await skambaVerTareas('', Number(lista.pro_ide));
                if (res.success) {
                    setTasks(res.data);
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [lista.pro_ide]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const res = await skambaVerTareas('', Number(lista.pro_ide));
            if (res.success) {
                setTasks(res.data);
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
                    <RowView lista={updatedLista} onRefresh={handleRefresh} />
                ) : (
                    <KanbanBoard lista={updatedLista} onRefresh={handleRefresh} />
                )}
            </div>
        </div>
    );
}
