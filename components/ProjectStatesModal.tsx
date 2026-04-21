'use client';

import { useState, useEffect } from 'react';
import {
    skambaConseguirEstados,
    skambaAgregarEstadoProyecto,
    type Estado,
} from '../lib/api';
import { X, Plus } from 'lucide-react';

interface ProjectStatesModalProps {
    proId: number | string;
    onClose: () => void;
    onUpdate?: () => void;
}

export function ProjectStatesModal({ proId, onClose, onUpdate }: ProjectStatesModalProps) {
    const [estados, setEstados] = useState<Estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [adding, setAdding] = useState(false);

    const proIdNum = Number(proId);

    useEffect(() => {
        loadData();
    }, [proId]);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const estadosRes = await skambaConseguirEstados('');
            if (estadosRes.success) {
                setEstados(estadosRes.data);
            }
        } catch (err) {
            setError('Error al cargar los estados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAgregarEstado(estId: number) {
        setAdding(true);
        setError('');
        try {
            const res = await skambaAgregarEstadoProyecto('', proIdNum, estId);
            if (res.success) {
                await loadData();
                onUpdate?.();
            } else {
                setError(res.message || 'Error al agregar estado');
            }
        } catch (err) {
            setError('Error al agregar estado');
            console.error(err);
        } finally {
            setAdding(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Estados Disponibles</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Selecciona los estados para este proyecto
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div>
                            {estados.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No hay estados disponibles</p>
                            ) : (
                                <div className="space-y-2">
                                    {estados.map(est => (
                                        <div
                                            key={est.est_ide}
                                            className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full shrink-0"
                                                    style={{ backgroundColor: est.color || '#a1a1aa' }}
                                                ></div>
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                        {est.est_nom}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">Orden: {est.est_ord}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAgregarEstado(est.est_ide)}
                                                disabled={adding}
                                                className="p-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
