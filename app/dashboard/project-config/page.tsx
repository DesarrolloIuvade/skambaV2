'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../context/DashboardContext';
import { ProjectStatesModal } from '../../../components/ProjectStatesModal';
import { skambaConseguirProyecto, type Lista } from '../../../lib/api';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ProjectConfigPage() {
    const { selectedView, workspaces } = useDashboard();
    const [lista, setLista] = useState<Lista | null>(null);
    const [loading, setLoading] = useState(false);
    const [showStatesModal, setShowStatesModal] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (selectedView?.type === 'list') {
                const listaData = selectedView.lista;
                setLista(listaData);

                // Load full project data
                setLoading(true);
                try {
                    const res = await skambaConseguirProyecto('', Number(listaData.pro_ide));
                    if (res.success && res.data && 'tareas' in res.data) {
                        setLista(res.data as Lista);
                    }
                } catch (err) {
                    console.error('Error loading project:', err);
                } finally {
                    setLoading(false);
                }
            }
        }
        loadData();
    }, [selectedView]);

    if (!lista) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-zinc-500">Selecciona un proyecto para configurarlo</p>
                <Link href="/dashboard" className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    ← Volver al dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="mb-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </Link>
                <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-zinc-900 dark:text-white" />
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Configuración del Proyecto</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{lista.pro_nom}</p>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
                {/* States Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white">Estados del Proyecto</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Administra los estados disponibles para las tareas en este proyecto.
                            </p>
                            <p className="text-xs text-zinc-400 mt-2">
                                Estados configurados: {lista.estados?.length || 0}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowStatesModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                        >
                            Gestionar
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showStatesModal && (
                <ProjectStatesModal
                    proId={lista.pro_ide}
                    onClose={() => setShowStatesModal(false)}
                    onUpdate={() => {
                        // Refresh lista data
                        setLoading(true);
                        skambaConseguirProyecto('', Number(lista.pro_ide))
                            .then(res => {
                                if (res.success && res.data && 'tareas' in res.data) {
                                    setLista(res.data as Lista);
                                }
                            })
                            .finally(() => setLoading(false));
                    }}
                />
            )}
        </div>
    );
}
