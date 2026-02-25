'use client';

import { useState, useEffect } from 'react';
import { Workspace, skambaConseguirProyectos } from '../lib/api';

interface WorkspaceSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (workspaceId: string) => void;
    adding?: boolean;
}

export function WorkspaceSelectorModal({ isOpen, onClose, onSelect, adding = false }: WorkspaceSelectorModalProps) {
    const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedId, setSelectedId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadWorkspaces();
        }
    }, [isOpen]);

    async function loadWorkspaces() {
        const token = localStorage.getItem('sk_token') ?? '';
        const usu_ide = Number(localStorage.getItem('sk_usu_ide') ?? '0');

        if (!token || !usu_ide) {
            setError('No se pudo autenticar');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await skambaConseguirProyectos(token, usu_ide);
            if (res.success && res.data) {
                // Filtrar solo workspaces (pro_tip === 'workspace')
                const workspaces = res.data.filter(w => w.pro_tip === 'workspace');
                setAvailableWorkspaces(workspaces);
            } else {
                setError('No se pudieron cargar los workspaces');
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    }

    function handleSelect() {
        if (selectedId) {
            onSelect(selectedId);
            setSelectedId('');
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Seleccionar Workspace
                </h2>

                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-zinc-400">Cargando workspaces...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={loadWorkspaces}
                            className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : availableWorkspaces.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-zinc-400">No hay workspaces disponibles</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                            {availableWorkspaces.map((ws) => (
                                <button
                                    key={ws.pro_ide}
                                    onClick={() => setSelectedId(ws.pro_ide)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${selectedId === ws.pro_ide
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {ws.pro_nom.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-zinc-900 dark:text-white truncate">
                                            {ws.pro_nom}
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                            ID: {ws.pro_ide}
                                        </p>
                                    </div>
                                    {selectedId === ws.pro_ide && (
                                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSelect}
                                disabled={!selectedId || adding}
                                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 px-4 py-2 text-sm font-semibold text-white disabled:text-zinc-500 transition-colors"
                            >
                                {adding ? 'Agregando...' : 'Agregar'}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={adding}
                                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
